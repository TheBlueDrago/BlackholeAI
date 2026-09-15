import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const CONNECTOR_ID = '6aa89fba1b216971986db4cf';

// UTF-8-safe base64 (handles multi-byte chars in website HTML without call-stack limits).
function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');

    let accessToken: string;
    try {
      const conn = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
      accessToken = conn.accessToken;
    } catch (_) {
      return Response.json({ error: 'not_connected' }, { status: 403 });
    }

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (action === 'repos') {
      const r = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated&direction=desc', { headers });
      if (!r.ok) return Response.json({ error: 'GitHub API error' }, { status: 502 });
      const repos = await r.json();
      return Response.json({
        repos: repos.map((repo: any) => ({ full_name: repo.full_name, name: repo.name, private: repo.private, default_branch: repo.default_branch })),
      });
    }

    if (action === 'push') {
      const repo = String(body.repo || ''); // "owner/repo"
      const html = String(body.html || '');
      const path = String(body.path || 'index.html');
      const message = String(body.message || 'Update website from Blackhole AI');

      if (!repo || !html) return Response.json({ error: 'repo and html required' }, { status: 400 });

      const [owner, repoName] = repo.split('/');
      if (!owner || !repoName) return Response.json({ error: 'Invalid repo format (use owner/repo)' }, { status: 400 });

      // Check if the file already exists so we can update it (needs SHA).
      let sha: string | null = null;
      const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${path}`, { headers });
      if (checkRes.ok) {
        const fileData = await checkRes.json();
        sha = fileData.sha;
      }

      const pushRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${path}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content: toBase64(html), ...(sha ? { sha } : {}) }),
      });

      if (!pushRes.ok) {
        const errText = await pushRes.text();
        console.error('github-push: push failed', { status: pushRes.status, errText });
        return Response.json({ error: 'Failed to push to GitHub', details: errText }, { status: 502 });
      }

      const result = await pushRes.json();
      return Response.json({
        success: true,
        fileUrl: result.content?.html_url,
        repoUrl: `https://github.com/${repo}`,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('github-push failed', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}