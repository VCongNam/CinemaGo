module.exports = {
  testEnvironment: 'node',

  transform: {
    '^.+\\.(js|jsx|mjs|ts|tsx)$': 'babel-jest',
  },

  transformIgnorePatterns: [
    "/node_modules/(?!(supertest|mongodb-memory-server|express|mongoose|@babel/runtime))"
  ],
  
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  moduleFileExtensions: ['js', 'mjs', 'json', 'node'],
};