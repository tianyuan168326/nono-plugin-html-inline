# nono-plugin-html-inline

将NONo笔记插件的所有本地资源（css、js、image）内联打包，使发布时只有一个html文件

# 使用（建议使用[cnpm](https://npm.taobao.org/)）
在你的插件开发目录安装`nono-plugin-html-inline`
```
npm install nono-plugin-html-inline --save-dev  
```
对你的插件进行单文件内联打包
```
node node_modules/nono-plugin-html-inline/bin/cmd.js build/index.html -o release/plugin_xxx.html
```


# license

MIT
