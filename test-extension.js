// 简单的测试脚本来验证插件配置
const fs = require('fs');
const path = require('path');

// 读取package.json
const packagePath = path.join(__dirname, 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

console.log('=== VSCode Extension Configuration Test ===');
console.log('Extension Name:', packageJson.name);
console.log('Display Name:', packageJson.displayName);
console.log('Main Entry:', packageJson.main);

// 检查主要配置
const contributes = packageJson.contributes;
if (contributes) {
    console.log('\n=== ViewsContainers ===');
    if (contributes.viewsContainers && contributes.viewsContainers.activitybar) {
        contributes.viewsContainers.activitybar.forEach(container => {
            console.log(`- ID: ${container.id}`);
            console.log(`- Title: ${container.title}`);
            console.log(`- Icon: ${container.icon}`);
        });
    }

    console.log('\n=== Views ===');
    if (contributes.views) {
        Object.keys(contributes.views).forEach(containerId => {
            console.log(`Container: ${containerId}`);
            contributes.views[containerId].forEach(view => {
                console.log(`  - View ID: ${view.id}`);
                console.log(`  - View Name: ${view.name}`);
                console.log(`  - When: ${view.when || 'always'}`);
            });
        });
    }

    console.log('\n=== Commands ===');
    if (contributes.commands) {
        contributes.commands.forEach(cmd => {
            console.log(`- ${cmd.command}: ${cmd.title}`);
        });
    }
}

// 检查编译输出
const distPath = path.join(__dirname, 'dist', 'extension.js');
if (fs.existsSync(distPath)) {
    console.log('\n✅ Compiled extension.js exists');
    const stats = fs.statSync(distPath);
    console.log(`   Size: ${Math.round(stats.size / 1024)}KB`);
    console.log(`   Modified: ${stats.mtime.toISOString()}`);
} else {
    console.log('\n❌ Compiled extension.js not found');
}

// 检查媒体文件
const iconPath = path.join(__dirname, 'media', 'icon.svg');
if (fs.existsSync(iconPath)) {
    console.log('✅ Icon file exists');
} else {
    console.log('❌ Icon file not found');
}

console.log('\n=== Test Complete ===');
