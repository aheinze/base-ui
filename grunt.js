/*global module:false*/
module.exports = function(grunt) {

  var exec = require('child_process').exec,
    util = require('util'),
    sys  = require('sys'),
    fs   = require('fs');

  // Project configuration.
  grunt.initConfig({
    pkg: '<json:base-ui.json>',
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    shell: {
      build: {
        commands: [
          'lessc src/less/_all.less > dist/base-ui.min.css -x',
          'uglifyjs '+([
            'src/js/base.js',
            'src/js/menu.js',
            'src/js/modal.js',
            'src/js/topbox.js'
          ].join(" "))+' -o dist/base-ui.min.js'
        ],
        infos: [
          "Compiling less files.",
          "Compiling js files."
        ],
        options: {
          "cwd": __dirname
        },
        before: function(){
          fs.mkdir(__dirname+'/dist');
        },
        after: function(){

          fs.mkdir(__dirname+'/dist/fonts');

          ["fontawesome-webfont.eot", "fontawesome-webfont.ttf", "fontawesome-webfont.woff"].forEach(function(file) {
            grunt.file.copy('src/less/fonts/'+file, 'dist/fonts/'+file);
          });
        }
      }
    },
    lint: {
      files: ['src/js/*.js']
    },
    jshint: {
      options: {
        validthis : true,
        laxcomma  : true,
        laxbreak  : true,
        browser   : true,
        eqnull    : true,
        debug     : true,
        devel     : true,
        boss      : true,
        expr      : true,
        asi       : true,
        funcscope : true,
        smarttabs : true,
        sub     : true,
        evil    : true
      },
      globals: {
        jQuery: true
      }
    },
    watch: {
      files: ['src/less/*.less', 'src/js/*.js'],
      tasks: 'shell'
    }
  });

  // Default task.
  grunt.registerTask('default', 'shell');



  // helper

  grunt.registerMultiTask('shell', 'Execute a list of commands', function () {

    var cmds    = this.data.commands || "",
      options = this.data.options || {},
      infos   = this.data.infos || {},
      before  = this.data.before || function(){},
      after   = this.data.after || function(){},
      cb      = this.async(),
      output  = [],
      executed = 0;

    cmds = typeof(cmds) == "string" ? [cmds]:cmds;

    if (!cmds.length) {
      grunt.log.error('No existing commands.');
      return cb();
    }

    before();

    cmds.forEach(function(cmd, index){ 
      
      // grunt.log.writeln("exec: "+cmd);

      exec(cmd, options, function(error, stdout, stderr) { 
        
        executed++;

        var msg = infos[index] ? infos[index] : cmd.split(" ")[0]+" ...";

        grunt.log[error ? "error":"ok"](msg + (error ? "Reason: " + error.message : ""));

        if(executed==cmds.length) {
          after();
          cb();
        }
      });
    });
  });

};