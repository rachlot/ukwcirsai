import { api } from "../../api/Api";

beforeAll(async () => {
  try {
    // connect to api using the test url + credentials
    api.setApiEndpoint( 'http://localhost:8080/' );
    api.setAuthorization( 'admin', 'djdjdj' );
  } catch (error) {
    console.log(error);
  }
});

afterAll(async () => {
  try {
  } catch (error) {
    console.log(error);
  }
});
