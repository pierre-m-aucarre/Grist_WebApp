exports.handler = async (event) => {
  const path = event.path.replace('/.netlify/functions/grist-proxy', '');
  const url = `https://grist.numerique.gouv.fr${path}?${new URLSearchParams(event.queryStringParameters).toString()}`;

  try {
    const response = await fetch(url, {
      method: event.httpMethod,
      headers: {
        'Authorization': `Bearer ${process.env.VITE_GRIST_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
