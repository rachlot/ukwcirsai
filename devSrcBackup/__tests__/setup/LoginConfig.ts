// Mock the LoginConfig
jest.mock("../../login/LoginConfig", () => { });

// Mock Map (react-leaflet not compatible with jest)
jest.mock("../../widgets/Map", () => { });

// Mock Spreadsheet
jest.mock("../../widgets/Spreadsheet", () => { });
