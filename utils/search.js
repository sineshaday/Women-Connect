// Function to generate keywords for an event
export const generateKeywords = (event) => {
    const keywordSet = new Set();
    
    // Add title words
    event.title.toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 2) keywordSet.add(word);
    });
  
    // Add category
    keywordSet.add(event.category.toLowerCase());
  
    // Add type
    keywordSet.add(event.type.toLowerCase());
  
    // Add location words if it's a venue
    if (event.type === 'venue' && event.location) {
      event.location.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) keywordSet.add(word);
      });
    }
  
    // Add description words
    if (event.description) {
      event.description.toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) keywordSet.add(word);
      });
    }
  
    return Array.from(keywordSet);
  };
  
  // Function to search events
  export const searchEvents = (events, searchTerm) => {
    if (!searchTerm.trim()) return events;
    
    const searchTerms = searchTerm.toLowerCase().split(/\s+/);
    
    return events.filter(event => {
      const eventString = `
        ${event.title} 
        ${event.category} 
        ${event.type} 
        ${event.location || ''} 
        ${event.description || ''}
      `.toLowerCase();
      
      return searchTerms.every(term => eventString.includes(term));
    });
  };