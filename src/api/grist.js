import { gristConfig } from '../config.js';

export const fetchGristRecords = async (tableId) => {
  const url = `/api/docs/${gristConfig.docId}/tables/${tableId}/records`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Grist API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};
