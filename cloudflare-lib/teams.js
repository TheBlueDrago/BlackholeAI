// Teams, kept in KV instead of Base44's Team table. Base44's team functions (my-team,
// team-invite, …) each used up some of the Base44 "integration" allowance, and when it
// ran out every Base44 function started failing with 402 — so they now live here.
//
//   team:<ownerId>  -> { ownerId, ownerEmail, memberEmails, pendingRemovalEmails,
//                        ownerLeaving, ownerPlan, ownerPlanAt }
//   teamof:<email>  -> ownerId (which team a member belongs to)
//
// A team exists for anyone whose own plan is Team or Secret (or an admin). Members get
// the team plan while the owner still has it: ownerPlan is refreshed whenever the owner
// uses the app, and a record not refreshed for OWNER_STALE_DAYS stops granting access.
export const TEAM_PLANS = ["team", "secret", "admin"];
export const TEAM_CAP = { team: 2, secret: 4, admin: 4 };
const OWNER_STALE_DAYS = 35;

async function getJSON(kv, key, fallback) {
  try {
    const v = await kv.get(key, "json");
    return v == null ? fallback : v;
  } catch {
    return fallback;
  }
}

export const cleanEmail = (e) => String(e || "").trim().toLowerCase();

export async function readTeam(kv, ownerId) {
  return getJSON(kv, `team:${ownerId}`, null);
}

export async function saveTeam(kv, team) {
  await kv.put(`team:${team.ownerId}`, JSON.stringify(team));
}

function blankTeam(owner, plan) {
  return {
    ownerId: owner.id,
    ownerEmail: cleanEmail(owner.email),
    memberEmails: [],
    pendingRemovalEmails: [],
    ownerLeaving: false,
    ownerPlan: plan,
    ownerPlanAt: new Date().toISOString(),
  };
}

// The owner's current (non-team) plan is known when they use the app; keep the team's
// copy of it fresh so members' access follows it. Writes only when something changed
// or the timestamp is more than a day old.
export async function refreshOwnerPlan(kv, owner, plan) {
  const team = await readTeam(kv, owner.id);
  if (!team) return null;
  const age = Date.now() - new Date(team.ownerPlanAt || 0).getTime();
  if (team.ownerPlan !== plan || age > 24 * 3600 * 1000) {
    team.ownerPlan = plan;
    team.ownerPlanAt = new Date().toISOString();
    await saveTeam(kv, team).catch(() => {});
  }
  return team;
}

function teamActive(team) {
  if (!team || !TEAM_PLANS.includes(team.ownerPlan)) return false;
  return Date.now() - new Date(team.ownerPlanAt || 0).getTime() < OWNER_STALE_DAYS * 24 * 3600 * 1000;
}

// For credits: which shared pool (if any) this user draws Blackhole Code from, and the
// plan a membership gives. basePlan is the user's own plan (admin, grant or payment).
export async function teamFor(kv, user, basePlan) {
  if (["team", "secret"].includes(basePlan)) {
    await refreshOwnerPlan(kv, user, basePlan);
    return { plan: basePlan, teamId: user.id };
  }
  const email = cleanEmail(user.email);
  if (!email) return null;
  const ownerId = await kv.get(`teamof:${email}`);
  if (!ownerId || ownerId === user.id) return null;
  const team = await readTeam(kv, ownerId);
  if (!team || !team.memberEmails.includes(email) || !teamActive(team)) return null;
  return { plan: team.ownerPlan === "secret" || team.ownerPlan === "admin" ? "secret" : "team", teamId: ownerId };
}

// The shape the Team screens expect (formerly from Base44's my-team).
export async function myTeam(kv, user, basePlan, aiCodeUsed) {
  const isAdmin = user.role === "admin";
  if (TEAM_PLANS.includes(basePlan)) {
    const team = (await refreshOwnerPlan(kv, user, basePlan)) || blankTeam(user, basePlan);
    return {
      id: user.id,
      ownerId: user.id,
      memberEmails: team.memberEmails,
      pendingRemovalEmails: team.pendingRemovalEmails,
      ownerLeaving: !!team.ownerLeaving,
      aiCodeUsed,
      status: "active",
      active: true,
      isOwner: true,
      ownerPlan: basePlan === "admin" ? "secret" : basePlan,
      ownerPlanExpiresAt: null,
      isPromo: false,
      isAdmin,
    };
  }
  const email = cleanEmail(user.email);
  const ownerId = email ? await kv.get(`teamof:${email}`) : null;
  const team = ownerId ? await readTeam(kv, ownerId) : null;
  if (!team || !team.memberEmails.includes(email)) return null;
  return {
    id: ownerId,
    ownerId,
    memberEmails: team.memberEmails,
    pendingRemovalEmails: team.pendingRemovalEmails,
    ownerLeaving: !!team.ownerLeaving,
    aiCodeUsed,
    status: teamActive(team) ? "active" : "inactive",
    active: teamActive(team),
    isOwner: false,
    ownerPlan: team.ownerPlan === "admin" ? "secret" : team.ownerPlan,
    ownerPlanExpiresAt: null,
    isPromo: false,
    isAdmin: false,
  };
}

export async function invite(kv, owner, basePlan, emails) {
  if (!TEAM_PLANS.includes(basePlan)) throw new Error("Only a Team or Secret plan owner can invite members.");
  const team = (await readTeam(kv, owner.id)) || blankTeam(owner, basePlan);
  const cap = TEAM_CAP[basePlan];
  const own = cleanEmail(owner.email);
  for (const raw of Array.isArray(emails) ? emails : [emails]) {
    const e = cleanEmail(raw);
    if (!e || e === own || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) || team.memberEmails.includes(e)) continue;
    if (team.memberEmails.length >= cap) break;
    const other = await kv.get(`teamof:${e}`);
    if (other && other !== owner.id) {
      const theirs = await readTeam(kv, other);
      if (theirs && theirs.memberEmails.includes(e)) throw new Error(`${e} is already on another team.`);
    }
    team.memberEmails.push(e);
    await kv.put(`teamof:${e}`, owner.id);
  }
  team.ownerPlan = basePlan;
  team.ownerPlanAt = new Date().toISOString();
  await saveTeam(kv, team);
  return team;
}

export async function removeMembers(kv, owner, emails) {
  const team = await readTeam(kv, owner.id);
  if (!team) throw new Error("Only a Team owner can remove members.");
  const drop = (Array.isArray(emails) ? emails : [emails]).map(cleanEmail).filter(Boolean);
  team.memberEmails = team.memberEmails.filter((e) => !drop.includes(e));
  team.pendingRemovalEmails = (team.pendingRemovalEmails || []).filter((e) => !drop.includes(e));
  await saveTeam(kv, team);
  for (const e of drop) if ((await kv.get(`teamof:${e}`)) === owner.id) await kv.delete(`teamof:${e}`);
  return team;
}

// A member leaves right away; an owner is marked as leaving (their plan ends with the
// subscription, which they cancel on Wix).
export async function leave(kv, user) {
  const own = await readTeam(kv, user.id);
  if (own) {
    own.ownerLeaving = true;
    await saveTeam(kv, own);
    return {
      ok: true,
      role: "owner",
      message: "Your team stays active until your plan ends. Cancel the Wix subscription too to stop future charges.",
    };
  }
  const email = cleanEmail(user.email);
  const ownerId = email ? await kv.get(`teamof:${email}`) : null;
  const team = ownerId ? await readTeam(kv, ownerId) : null;
  if (!team || !team.memberEmails.includes(email)) throw new Error("You are not on a team.");
  team.memberEmails = team.memberEmails.filter((e) => e !== email);
  await saveTeam(kv, team);
  await kv.delete(`teamof:${email}`);
  return { ok: true, role: "member", message: "You've left the team." };
}
