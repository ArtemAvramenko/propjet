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
                src: ["src/propjet.d.ts", "src/propjet.ts"]
            }
        },
        uglify: {
            default: {
                files: {
                    'src/propjet.min.js': ['src/propjet.js']
                }
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
                    'dist/propjet.js': ['src/propjet.js'],
                    'dist/propjet.min.js': ['src/propjet.min.js'],
                    'dist/propjet.d.ts': ['src/propjet.d.ts'],
                }
            }
        },
        zip: {
            default: {
                cwd: 'dist/',
                src: ['dist/*.*'],
                dest: 'PropjetJS.zip',
                compression: 'DEFLATE'
            }
        }
    });

    grunt.registerTask('default', ['ts', 'uglify', 'concat', 'zip']);
}