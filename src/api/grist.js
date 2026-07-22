import { n8nConfig } from '../config.js';

export const fetchGristRecords = async (tableId, params = {}) => {
  const query = new URLSearchParams({ table: tableId, ...params });
  const url = `${n8nConfig.webhookUrl}?${query.toString()}`;
  const response = await fetch(url, {
    headers: {
      'x-api-key': n8nConfig.webhookKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Erreur webhook n8n: ${response.status} ${response.statusText}`);
  }

  return response.json();
};
