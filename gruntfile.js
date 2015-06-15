module.exports = function(grunt) {

  grunt.registerTask('watch', [ 'watch' ]);

  grunt.initConfig({
    jshint: {
      all: {
        src: ['utils/*.js', 'routes/*.js', 'server.js']
      }
    },
    watch: {
      js: {
        files: ['utils/*.js', 'routes/*.js', 'server.js'],
        tasks: ['jshint'],
        options: {
          livereload: false,
        }
      },
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

};
