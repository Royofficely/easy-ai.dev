// Template rendering utilities
function renderTemplate(template, parameters = {}) {
  let rendered = template;
  
  // Replace {{variable}} with actual values
  Object.entries(parameters).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    rendered = rendered.replace(regex, value);
  });
  
  // Check for unreplaced variables
  const unreplacedVars = rendered.match(/{{[^}]+}}/g);
  if (unreplacedVars) {
    console.warn('Unreplaced template variables found:', unreplacedVars);
  }
  
  return rendered;
}

function validateTemplate(template, requiredParameters = []) {
  const templateVars = extractTemplateVariables(template);
  const missing = requiredParameters.filter(param => !templateVars.includes(param));
  
  if (missing.length > 0) {
    throw new Error(`Missing required parameters: ${missing.join(', ')}`);
  }
  
  return true;
}

function extractTemplateVariables(template) {
  const matches = template.match(/{{([^}]+)}}/g) || [];
  return matches.map(match => match.replace(/[{}]/g, '').trim());
}

module.exports = {
  renderTemplate,
  validateTemplate,
  extractTemplateVariables
};