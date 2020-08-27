/* global module: true */
module.exports = function (grunt) {
  grunt.initConfig({
    htmlmin: {
      options: {
        collapseWhitespace: true,
        preserveLineBreaks: false
      },
      files: {
        expand: true,
        src: ['*.html', 'labs/*.html'],
        dest: 'dist/'
      }
    },
    cssmin: {
      files: {   
        expand: true,
        src: ['labs/css/*.css'],
        dest: 'dist/'
      }
    },
    imagemin: {
      files: {
        expand: true,
        src: ['labs/images/*.{png,jpg,gif}'],
        dest: 'dist/'
      }
    },
    uglify: {
      main: {
        files: [{
          expand: true,
          src: ['labs/js/*.js'],
          dest: 'dist/'
        }]
      }
    },
    replace: {
      html: {
        src: ['dist/*.html', 'dist/**/*.html'],
        overwrite: true,
        replacements: [{
          from: 'href="css',
          to: 'href="https://cdn.jsdelivr.net/gh/wangding/info-lab@gh-pages/labs/css'
        }, {
          from: 'src="js',
          to: 'src="https://cdn.jsdelivr.net/gh/wangding/info-lab@gh-pages/labs/js'
        }]
      }
    },
    copy: {
      main: {
        files: [
          {
            expand: true,
            cwd: '03-third-part-widget',
            src: 'mathquill/**',
            dest: 'dist/03-third-part-widget/'
          }
        ]
      }
    },
    htmlhint: {
      options: {
        htmlhintrc: '.htmlhintrc'
      },
      src: ['*.html', 'labs/*.html']
    },
    csslint: {
      options: {
        csslintrc: '.csslintrc'
      },
      src: ['labs/css/*.css']
    },
    eslint: {
      options: {
        configFile: '.eslintrc.json'
      },
      target: ['./labs/js/*.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-imagemin');

  grunt.loadNpmTasks('grunt-htmlhint');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-eslint');
  grunt.loadNpmTasks('grunt-text-replace');

  grunt.registerTask('lint', ['htmlhint', 'csslint', 'eslint']);
  grunt.registerTask('build', ['htmlmin', 'cssmin', 'uglify', 'imagemin', 'replace']);
};
