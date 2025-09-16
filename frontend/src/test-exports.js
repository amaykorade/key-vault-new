// Test file to check exports
import * as Types from './types/index';
console.log('Available exports:', Object.keys(Types));
console.log('AuthResponse exists:', 'AuthResponse' in Types);
