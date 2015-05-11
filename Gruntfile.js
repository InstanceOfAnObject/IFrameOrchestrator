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
        files: ['package.json', 'bower.json'],
        updateConfigs: [],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['package.json', 'bower.json', 'Gruntfile.js'],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: false,
        pushTo: 'upstream',
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
  grunt.registerTask('travis', ['jshint']);

  // change version and generate minified version
  /*
    To push a new version:
      1. commit everything you want to be present in the next version
      2. execute:
        2.1: patch version:   grunt patch
        2.2: minor verion:    grunt minor
        2.3: major version:   grunt major
      3. Push to git
  */
  
  /*  Release procedure:
      ==================
        grunt patch
        git add [list of files to add except bower.json and package.json (include dist and src)]
        git commit -m "description of the commit"
        grunt commit  => this creates the tagand pushes the remaining bower.json and package.json
        git push
  */
  grunt.registerTask('patch', ['jshint', 'bump-only:patch', 'clean', 'uglify']);
  grunt.registerTask('minor', ['jshint', 'bump-only:minor', 'clean', 'uglify']);
  grunt.registerTask('major', ['jshint', 'bump-only:major', 'clean', 'uglify']);
  
  grunt.registerTask('commit', ['bump-commit']);
};
