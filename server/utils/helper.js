// Importing genSaltSync and hashSync functions from the 'bcrypt' library
import { compareSync, genSaltSync, hashSync } from 'bcrypt';

// Function to hash a plain-text password
export function hashPassword(password){

    // Generate a salt using the default number of rounds 10
    const salt=genSaltSync();

    // Hash the password using the generated salt
    const hashedPassword= hashSync(password,salt);

     // Return the hashed password
     return hashedPassword;
}


/**
 * Compares a raw (plain-text) password with a hashed password
 * 
 * @param {string} raw - The plain-text password entered by the user
 * @param {string} hashedPassword - The hashed password stored (e.g., in DB)
 * @returns {boolean} - true if the passwords match, false otherwise
 */
export function comparePassword(raw, hashedPassword) {
    // Compare the plain-text password to the hash
    return compareSync(raw, hashedPassword);
}

