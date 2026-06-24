import { SmmApiClient } from './smm_api.js';

const apiKey = '09ee1dfc0f11b367cecc8ef2df20ab9b';
const client = new SmmApiClient(apiKey);

async function runTest() {
  console.log('Testing SMM Panel Connection...');
  
  // Test balance fetch
  console.log('\n1. Fetching SMM Wallet Balance...');
  const balanceRes = await client.getBalance();
  console.log('Balance Response:', JSON.stringify(balanceRes, null, 2));

  // Test services fetch
  console.log('\n2. Fetching SMM Services...');
  const servicesRes = await client.fetchServices();
  if (Array.isArray(servicesRes)) {
    console.log(`Successfully fetched ${servicesRes.length} SMM services!`);
    console.log('First Service details:', JSON.stringify(servicesRes[0], null, 2));
  } else {
    console.log('Failed to fetch services. Response:', JSON.stringify(servicesRes, null, 2));
  }
}

runTest();
