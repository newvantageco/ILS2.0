#!/usr/bin/env node
// Railway API Client - Direct GraphQL access
// Usage: RAILWAY_TOKEN=xxx node railway-api.mjs <command>

const RAILWAY_API = 'https://backboard.railway.app/graphql/v2';
const TOKEN = process.env.RAILWAY_TOKEN;

if (!TOKEN) {
  console.error('Error: RAILWAY_TOKEN environment variable required');
  process.exit(1);
}

async function railwayQuery(query, variables = {}) {
  const response = await fetch(RAILWAY_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error ${response.status}: ${text}`);
  }

  return response.json();
}

const QUERIES = {
  me: `query { me { id email name } }`,

  projects: `query {
    me {
      projects {
        edges {
          node {
            id
            name
            description
            createdAt
            environments { edges { node { id name } } }
            services { edges { node { id name } } }
          }
        }
      }
    }
  }`,

  deployments: `query($projectId: String!) {
    deployments(input: { projectId: $projectId }, first: 10) {
      edges {
        node {
          id
          status
          createdAt
          service { name }
          environment { name }
        }
      }
    }
  }`,

  services: `query($projectId: String!) {
    project(id: $projectId) {
      services {
        edges {
          node {
            id
            name
            createdAt
          }
        }
      }
    }
  }`,
};

async function main() {
  const command = process.argv[2] || 'me';
  const projectId = process.argv[3];

  console.log(`Railway API - Command: ${command}\n`);

  try {
    let result;

    switch (command) {
      case 'me':
      case 'whoami':
        result = await railwayQuery(QUERIES.me);
        console.log('User:', JSON.stringify(result.data?.me, null, 2));
        break;

      case 'projects':
      case 'list':
        result = await railwayQuery(QUERIES.projects);
        const projects = result.data?.me?.projects?.edges || [];
        console.log(`Found ${projects.length} project(s):\n`);
        for (const { node: p } of projects) {
          console.log(`📦 ${p.name} (${p.id})`);
          console.log(`   Created: ${p.createdAt}`);
          const envs = p.environments?.edges?.map(e => e.node.name) || [];
          const svcs = p.services?.edges?.map(s => s.node.name) || [];
          console.log(`   Environments: ${envs.join(', ') || 'none'}`);
          console.log(`   Services: ${svcs.join(', ') || 'none'}`);
          console.log('');
        }
        break;

      case 'deployments':
        if (!projectId) {
          console.error('Usage: railway-api.mjs deployments <projectId>');
          console.error('Run "railway-api.mjs projects" first to get project ID');
          process.exit(1);
        }
        result = await railwayQuery(QUERIES.deployments, { projectId });
        const deps = result.data?.deployments?.edges || [];
        console.log(`Recent deployments:\n`);
        for (const { node: d } of deps) {
          const status = d.status === 'SUCCESS' ? '✅' : d.status === 'FAILED' ? '❌' : '🔄';
          console.log(`${status} ${d.service?.name || 'unknown'} - ${d.status}`);
          console.log(`   Environment: ${d.environment?.name}`);
          console.log(`   Created: ${d.createdAt}`);
          console.log('');
        }
        break;

      case 'services':
        if (!projectId) {
          console.error('Usage: railway-api.mjs services <projectId>');
          process.exit(1);
        }
        result = await railwayQuery(QUERIES.services, { projectId });
        const services = result.data?.project?.services?.edges || [];
        console.log(`Services in project:\n`);
        for (const { node: s } of services) {
          console.log(`🔧 ${s.name} (${s.id})`);
        }
        break;

      default:
        console.log('Available commands: me, projects, deployments <projectId>, services <projectId>');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('401')) {
      console.error('\nInvalid or expired token. Get a new one from:');
      console.error('https://railway.app/account/tokens');
    }
    process.exit(1);
  }
}

main();
