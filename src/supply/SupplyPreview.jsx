import SupplyApp from './SupplyApp.jsx';

const id = crypto.randomUUID();
async function request(body) {
  const response = await fetch('/__supply_demo', {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', 'X-Demo-Workspace': id },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.message), { status: response.status });
  return data;
}
const client = { session: async () => {}, clear: () => {}, read: () => request(), command: (action, revision) => request({ action, revision }) };
export default function SupplyPreview() { return <SupplyApp previewClient={client} />; }
