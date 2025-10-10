import { compareSync, genSaltSync, hashSync } from 'bcrypt';

// Function to hash a plain-text password
export function hashPassword(password){

    
    const salt=genSaltSync();

    
    const hashedPassword= hashSync(password,salt);

    
     return hashedPassword;
}


/**
 * 
 * 
 * @param {string} raw 
 * @param {string} hashedPassword 
 * @returns {boolean} 
 */
export function comparePassword(raw, hashedPassword) {
    // Compare the plain-text password to the hash
    return compareSync(raw, hashedPassword);
}

