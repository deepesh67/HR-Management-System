/**
 * Generates initials from a full name.
 * Example: "Deepesh Sharma" -> "DS"
 * Example: "Khushi" -> "K"
 * @param {string} name - The full name of the user.
 * @returns {string} - The initials in uppercase.
 */
export const getInitials = (name) => {
    if (!name) return '?';
    
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
