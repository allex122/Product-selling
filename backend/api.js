import axios from 'axios';

async function getApiConfig(db) {
  const apiKeyRow = await db.get("SELECT value FROM settings WHERE key = 'accsbulk_api_key'");
  const baseUrlRow = await db.get("SELECT value FROM settings WHERE key = 'accsbulk_base_url'");

  return {
    apiKey: apiKeyRow ? apiKeyRow.value : '',
    baseUrl: baseUrlRow ? baseUrlRow.value : 'https://accsbulk.com/api/v1'
  };
}

function getHeaders(apiKey) {
  return {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
}

export async function checkApiConnection(db) {
  try {
    const { apiKey, baseUrl } = await getApiConfig(db);
    if (!apiKey) return { success: false, message: 'API key is missing in settings' };

    const response = await axios.get(`${baseUrl}/user/balance`, {
      headers: getHeaders(apiKey),
      timeout: 10000
    });

    if (response.data && response.data.success) {
      return { success: true, balance: response.data.data.balance };
    }
    return { success: false, message: response.data.message || 'API responded with failure' };
  } catch (error) {
    console.error('AccsBulk API connection error:', error.message);
    return { success: false, message: error.response?.data?.message || error.message };
  }
}

export async function getAccsBulkCategories(db) {
  try {
    const { apiKey, baseUrl } = await getApiConfig(db);
    const response = await axios.get(`${baseUrl}/categories`, {
      headers: getHeaders(apiKey),
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('getAccsBulkCategories error:', error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch categories from provider');
  }
}

export async function getAccsBulkSubcategories(db, categoryId) {
  try {
    const { apiKey, baseUrl } = await getApiConfig(db);
    const response = await axios.get(`${baseUrl}/categories/${categoryId}/subcategories`, {
      headers: getHeaders(apiKey),
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error(`getAccsBulkSubcategories for ${categoryId} error:`, error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch subcategories from provider');
  }
}

export async function getAccsBulkListings(db, queryParams = {}) {
  try {
    const { apiKey, baseUrl } = await getApiConfig(db);
    const response = await axios.get(`${baseUrl}/listings`, {
      headers: getHeaders(apiKey),
      params: queryParams,
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error('getAccsBulkListings error:', error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch listings from provider');
  }
}

export async function getAccsBulkListingDetail(db, slug) {
  try {
    const { apiKey, baseUrl } = await getApiConfig(db);
    const response = await axios.get(`${baseUrl}/listings/${slug}`, {
      headers: getHeaders(apiKey),
      timeout: 10000
    });
    return response.data;
  } catch (error) {
    console.error(`getAccsBulkListingDetail for ${slug} error:`, error.message);
    throw new Error(error.response?.data?.message || 'Failed to fetch listing detail from provider');
  }
}

export async function purchaseListing(db, adId, quantity, promoCode = null) {
  try {
    const { apiKey, baseUrl } = await getApiConfig(db);
    const payload = {
      ad_id: parseInt(adId),
      quantity: parseInt(quantity)
    };
    if (promoCode) {
      payload.promo_code = promoCode;
    }

    const response = await axios.post(`${baseUrl}/purchase`, payload, {
      headers: getHeaders(apiKey),
      timeout: 15000
    });
    return response.data;
  } catch (error) {
    console.error('purchaseListing API error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Provider API purchase failed');
  }
}
