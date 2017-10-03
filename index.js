var trumpet = require('trumpet');
var through = require('through2');
var fs = require('fs');
var path = require('path');
/**
 * 尚未能没有考虑到资源路径前的[空格]
 */
module.exports = function (opts) {
    if (!opts) opts = {};
    var basedir = opts.basedir || process.cwd();
    var tr = trumpet();

    if (!(opts.ignoreScripts || opts['ignore-scripts'])) {
        tr.selectAll('script[src]', function (node) {
             /**
             * remote resources[js:src] 不应该被内联
             */
            if(node.getAttribute('src').startsWith("http") 
            ||
            node.getAttribute('src').startsWith("//") 
            ){
                return ;
            }
             /**
              * 补丁结束
              */
            var file = fix(node.getAttribute('src'));
            node.removeAttribute('src');
            fs.createReadStream(file)
                .pipe(node.createWriteStream())
            ;
        });
    }
    if (!(opts.ignoreImages || opts['ignore-images'])) {
        tr.selectAll('img[src]', function (node) {
            inline64(node, 'src');
        })
    }
    if (!(opts.ignoreLinks || opts['ignore-links'])) {
        tr.selectAll('link[href]', function (node) {

            var rel = (node.getAttribute('rel') || '').toLowerCase();
            if (rel === 'stylesheet') return;
            inline64(node, 'href');
        })
    }
    if (!(opts.ignoreStyles || opts['ignore-styles'])) {
        tr.selectAll('link[href]', function (node) {
            var rel = node.getAttribute('rel').toLowerCase();
            if (rel !== 'stylesheet') return;
            /**
             * remote resources 不应该被内联
             */
            if(node.getAttribute('href').startsWith("http") 
            ||
            node.getAttribute('href').startsWith("//") 
            ){
                return ;
            }
             /**
              * 补丁结束
              */
            var file = fix(node.getAttribute('href'));

            var w = node.createWriteStream({ outer: true });
            w.write('<style>');
            var r = fs.createReadStream(file);
            r.pipe(w, { end: false });
            r.on('end', function () { w.end('</style>') });
        });
    }

    return tr;

    function fix (p) {
        if(path.isAbsolute(p)) {
            return path.resolve(basedir, path.relative('/', p));
        } else {
            return path.resolve(basedir, p);
        }
    }
    function enc (s) {
        return s.replace(/"/g, '&#34;')
            .replace(/>/g, '&gt;')
            .replace(/</g, '&lt;')
        ;
    }
    function inline64 (node, name) {
        var href = node.getAttribute(name);
           /**
             * remote resources 不应该被内联
             */
            if(href.startsWith("http") 
            ||
            href.startsWith("//") 
            ){
                return ;
            }
             /**
              * 补丁结束
              */
        if (/^data:/.test(href)) return;
        var file = fix(href);
        var w = node.createWriteStream({ outer: true });
        var attrs = node.getAttributes();
        w.write('<' + node.name);
        Object.keys(attrs).forEach(function (key) {
            if (key === name) return;
            w.write(' ' + key + '="' + enc(attrs[key]) + '"');
        });
        var ext = path.extname(file).replace(/^\./, '').toLowerCase();
        var type = node.getAttribute('type')
        if (!type) type = {
            svg: 'image/svg+xml',
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            gif: 'image/jpeg'
        }[ext] || 'image/png'
        w.write(' ' + name + '="data:' + type + ';base64,');
        fs.createReadStream(file).pipe(through(write, end));
        
        var bytes = 0, last = null;
        
        function write (buf, enc, next) {
            if (last) {
                buf = Buffer.concat([ last, buf ]);
                last = null;
            }
            
            var b;
            if (buf.length % 3 === 0) {
                b = buf;
            }
            else {
                b = buf.slice(0, buf.length - buf.length % 3);
                last = buf.slice(buf.length - buf.length % 3);
            }
            w.write(b.toString('base64'));
            
            next();
        }
        function end () {
            if (last) w.write(last.toString('base64'));
            w.end('">');
        }
    }
};
