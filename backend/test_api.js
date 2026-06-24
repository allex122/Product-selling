import { getDbConnection, initDb } from './database.js';
import { checkApiConnection, getAccsBulkCategories } from './api.js';

async function runTest() {
  console.log('--- Testing CYBER2 API Client Connection ---');
  await initDb(); // Initialize the SQLite database and create tables/default settings
  const db = await getDbConnection();
  try {
    const connTest = await checkApiConnection(db);
    console.log('Connection Test Result:', connTest);

    if (connTest.success) {
      console.log('Successfully connected to AccsBulk API!');
      console.log(`Current Balance: $${connTest.balance}`);

      console.log('\nFetching categories...');
      const categories = await getAccsBulkCategories(db);
      if (categories.success && categories.data) {
        console.log(`Successfully fetched ${categories.data.length} categories.`);
        console.log('Categories list:');
        categories.data.forEach(c => {
          console.log(` - ID ${c.id}: ${c.title} (${c.slug})`);
        });
      } else {
        console.log('Failed to parse categories:', categories);
      }
    } else {
      console.log('API connection failed. Please check your API key and network.');
    }
  } catch (error) {
    console.error('Test script encountered an error:', error.message);
  } finally {
    await db.close();
  }
}

runTest();
