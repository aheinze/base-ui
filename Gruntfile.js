module.exports = function(grunt) {

    "use strict";

    grunt.initConfig({

        pkg: grunt.file.readJSON("package.json"),

        meta: {
          banner: "/*! <%= pkg.title %> <%= pkg.version %> | <%= pkg.homepage %> | MIT License */"
        },

        jshint: {
            src: {
                options: {
                    jshintrc: "src/.jshintrc"
                },
                src: ["src/js/*.js"]
            },
            grunt: {
                src: ["Gruntfile.js"]
            }
        },

        less: {
            dist: {
                options: {
                    paths: ["src/less"]
                },
                files: {
                    "dist/base-ui.css": ["src/less/_all.less"]
                }
            },
            distmin: {
                options: {
                    paths: ["src/less"],
                    yuicompress: true
                },
                files: {
                    "dist/base-ui.min.css": ["src/less/_all.less"]
                }
            }
        },

        copy: {
            fonts: {
                files: [{ expand: true, cwd: "src/less/fonts", src: ["*"], dest: "dist/fonts/" }]
            }
        },

        concat: {
            dist: {
                options: {
                    separator: "\n\n"
                },
                src: ["src/js/base.js",
                      "src/js/button.js",
                      "src/js/dropdown.js",
                      "src/js/focuselement.js",
                      "src/js/growl.js",
                      "src/js/menu.js",
                      "src/js/modal.js",
                      "src/js/tooltip.js",
                      "src/js/topbox.js"],
                dest: "dist/base-ui.js"
            }
        },

        uglify: {
            distmin: {
                options: {
                    banner: "<%= meta.banner %>\n"
                },
                files: {
                    "dist/base-ui.min.js": ["dist/base-ui.js"]
                }
            }
        },

        compress: {
            dist: {
                options: {
                    archive: "dist/base-ui.zip"
                },
                files: [{ expand: true, cwd: "dist/", src: ["*.css", "*.js", "fonts/*"], dest: "" }]
            }
        },

        watch: {
            src: {
                files: ["src/less/*.less", "src/js/*.js"],
                tasks: ["build"]
            }
        }

    });

    // Load grunt tasks from NPM packages
    grunt.loadNpmTasks("grunt-contrib-less");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-compress");
    grunt.loadNpmTasks("grunt-contrib-watch");

    // Register grunt tasks
    grunt.registerTask("build", ["jshint", "less", "concat", "uglify", "copy"]);
    grunt.registerTask("default", ["build"]);

};