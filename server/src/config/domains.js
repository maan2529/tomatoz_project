export const officialDomains = {
  'react': ['react.dev', 'github.com/facebook/react'],
  'node.js': ['nodejs.org', 'github.com/nodejs/node'],
  'next.js': ['nextjs.org', 'github.com/vercel/next.js'],
  'vue': ['vuejs.org', 'github.com/vuejs/vue'],
  'angular': ['angular.io', 'github.com/angular/angular'],
  'python': ['python.org', 'github.com/python/cpython'],
  'django': ['djangoproject.com', 'github.com/django/django']
};

export const getPreferredDomains = (tech) => {
  return officialDomains[tech.toLowerCase()] || [];
};

export const isOfficialSource = (url, tech) => {
  const patterns = {
    'react': [/react\.dev/, /github\.com\/facebook\/react/],
    'node.js': [/nodejs\.org/, /github\.com\/nodejs\/node/],
    'next.js': [/nextjs\.org/, /github\.com\/vercel\/next\.js/],
    'vue': [/vuejs\.org/, /github\.com\/vuejs\/vue/],
    'angular': [/angular\.io/, /github\.com\/angular\/angular/]
  };

  const techPatterns = patterns[tech.toLowerCase()] || [];
  return techPatterns.some(pattern => pattern.test(url));
};