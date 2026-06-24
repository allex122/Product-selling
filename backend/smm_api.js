import axios from 'axios';

export class SmmApiClient {
  constructor(apiKey, baseUrl = 'https://wowsmmpanel.com/api/v2') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async _request(data) {
    try {
      const params = new URLSearchParams();
      params.append('key', this.apiKey);
      for (const [key, value] of Object.entries(data)) {
        params.append(key, value);
      }

      const response = await axios.post(this.baseUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      return response.data;
    } catch (error) {
      console.error('SMM Panel API request failed:', error.message);
      return { error: error.message };
    }
  }

  // Fetch SMM services list
  async fetchServices() {
    return this._request({ action: 'services' });
  }

  // Place SMM order (likes/followers/etc)
  async placeOrder(serviceId, link, quantity) {
    return this._request({
      action: 'add',
      service: serviceId,
      link: link,
      quantity: quantity
    });
  }

  // Get order status
  async getOrderStatus(orderId) {
    return this._request({
      action: 'status',
      order: orderId
    });
  }

  // Get multiple order status (up to 100)
  async getMultipleOrderStatus(orderIds) {
    const ids = Array.isArray(orderIds) ? orderIds.join(',') : orderIds;
    return this._request({
      action: 'status',
      orders: ids
    });
  }

  // Fetch admin account balance on SMM Panel
  async getBalance() {
    return this._request({ action: 'balance' });
  }
}
