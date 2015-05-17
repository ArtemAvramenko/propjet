module.exports = function (grunt) {
  
    grunt.loadNpmTasks('grunt-ts');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-zip');

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        ts: {
            default: {
                options: {
                    sourceMap: false,
                    comments: true,
                    target: 'es3'
                },
                src: ["Src/propjet.d.ts", "Src/propjet.ts"]
            }
        },
        uglify: {
            default: {
                files: {
                    'Src/propjet.min.js': ['Src/propjet.js']
                }
                // options: {
                    // compress: {
                        // evaluate: true,
                        // join_vars: true,
                        // if_return: true,
                        // cascade: true
                    // }
                // }
            }
        },
        concat: {
            default: {
                options: {
                    banner: '/*!\r\n' +
                        ' <%= pkg.name %>.js v<%= pkg.version %>\r\n' +
                        ' (c) 2015 <%= pkg.author %>. <%= pkg.homepage %>\r\n' +
                        ' License: <%= pkg.license %>\r\n' +
                        '*/\r\n'
                },
                files: {
                    'Dist/propjet.js': ['Src/propjet.js'],
                    'Dist/propjet.min.js': ['Src/propjet.min.js'],
                    'Dist/propjet.d.ts': ['Src/propjet.d.ts'],
                }
            }
        },
        zip: {
            default: {
                cwd: 'Dist/',
                src: ['Dist/*.*'],
                dest: 'PropjetJS.zip',
                compression: 'DEFLATE'
            }
        }
    });

    grunt.registerTask('default', ['ts', 'uglify', 'concat', 'zip']);
}