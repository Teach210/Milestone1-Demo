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

/**
 * Validates password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 * 
 * @param {string} password - The password to validate
 * @returns {object} - { isValid: boolean, message: string }
 */
export function validatePassword(password) {
    if (!password) {
        return { isValid: false, message: "Password is required" };
    }

    if (password.length < 8) {
        return { isValid: false, message: "Password must be at least 8 characters long" };
    }

    // Check for uppercase letter
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one uppercase letter" };
    }

    // Check for lowercase letter
    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one lowercase letter" };
    }

    // Check for number
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one number" };
    }

    // Check for special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one special character (!@#$%^&*()_+-=[]{}...)" };
    }

    return { isValid: true, message: "Password is strong" };
}
