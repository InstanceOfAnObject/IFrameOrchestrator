'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: function() { return grunt.file.readJSON('package.json'); },
    banner: '/*! <%= pkg().title || pkg().name %> - v<%= pkg().version %> - ' +
      '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
      '<%= pkg().homepage ? "* " + pkg().homepage + "\\n" : "" %>' +
      '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg().author.name %>;' +
      ' Licensed <%= _.pluck(pkg().licenses, "type").join(", ") %> */\n',
    // Task configuration.
    clean: {
      src: ['dist']
    },
    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      dist: {
        files: {
          'dist/IFrameOrchestrator.<%= pkg().version %>.min.js': ['src/IFrameOrchestrator.js'],
          'dist/IFrameOrchestratorClient.<%= pkg().version %>.min.js': ['src/IFrameOrchestratorClient.js']
        }
      },
    },
    jshint: {
      src: {
        options: {
          jshintrc: '.jshintrc'
        },
        src: ['src/**/*.js']
      }
    },
    bump: {
      options: {
        files: ['package.json'],
        updateConfigs: [],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['package.json'],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: false,
        pushTo: 'origin/master',
        gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
        globalReplace: false
      }
    }
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // Default task.
  grunt.registerTask('default', ['jshint', 'clean', 'uglify']);
  grunt.registerTask('test', ['jshint', 'clean', 'uglify']);

  grunt.registerTask('patch', ['jshint', 'bump-only:patch', 'clean', 'uglify', 'bump-commit']);
  
  grunt.registerTask('travis', ['jshint']);

};
