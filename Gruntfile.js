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
    terser: {
      main: {
        files: [{
          expand: true,
          src: ['labs/js/*.js'],
          dest: 'dist/'
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
    qiniu_qupload: {
      default_options: {
        options: {
          ak: 'QINIU_AK',
          sk: 'QINIU_SK',
          bucket: 'app-info-lab',
          assets: [{src: 'dist', prefix: ''}]
        }
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

  grunt.loadNpmTasks('grunt-terser');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('@wangding/grunt-qiniu-qupload');
  grunt.loadNpmTasks('grunt-htmlhint');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-eslint');

  grunt.registerTask('lint', ['htmlhint', 'csslint', 'eslint']);
  grunt.registerTask('build', ['htmlmin', 'cssmin', 'terser']);
  grunt.registerTask('upload', ['qiniu_qupload']);
};
