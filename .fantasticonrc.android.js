module.exports = {
  inputDir: './src/assets/font-icons-android',
  outputDir: './src/styles',
  name: 'brilliant-icons-android',
  fontTypes: ['woff', 'woff2'],
  assetTypes: ['css'],
  tag: '',
  // Use a custom Handlebars template scoped to Android
  templates: {
    css: './plugins/brilliant-icons-android.css.hbs',
  },
};
