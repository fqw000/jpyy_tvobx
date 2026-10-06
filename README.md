# 🎬 金牌影院 TVBox 源

一个专为 TVBox 定制的金牌影院视频源配置，支持电影、电视剧、综艺、动漫等多种内容。

## 📺 功能特性

- ✅ 支持电影、电视剧、综艺、动漫
- ✅ 快速搜索功能
- ✅ 支持多种排序方式（热门、更新、评分）
- ✅ 多地区筛选（国产、香港、台湾、美国、韩国、日本）
- ✅ 年份筛选（2016-2025）
- ✅ 自动获取播放链接

## 🚀 快速使用

### 方式一：直接导入配置源

在 TVBox 应用中，选择 **添加源** 或 **导入配置**：

```
https://raw.githubusercontent.com/fqw000/jpyy_tvobx/main/manifest.json
```

### 方式二：自建配置

如果上述地址无法访问，可以手动添加源：

1. 在 TVBox 中选择 **管理** → **添加源**
2. 输入以下信息：
   - 名称：金牌影院
   - 类型：扩展源
   - 地址：`https://raw.githubusercontent.com/fqw000/jpyy_tvobx/main/manifest.json`

## 📋 配置说明

### manifest.json

定义源的基本信息和加载规则：

```json
{
  "sites": [
    {
      "key": "jpyy",
      "name": "金牌影院",
      "type": 3,
      "api": "./drpy/libs/drpy2.min.js",
      "ext": "./drpy/js/jpyy.js",
      "searchable": 1,
      "quickSearch": 1,
      "filterable": 0
    }
  ]
}
```

- **key**: 源的唯一标识符
- **name**: 在 TVBox 中显示的名称
- **type**: 3 表示 drpy 扩展源
- **api**: drpy2 框架的路径
- **ext**: JavaScript 规则文件的路径
- **searchable**: 是否支持搜索（1=支持）
- **quickSearch**: 是否支持快速搜索（1=支持）
- **filterable**: 是否支持过滤（0=不支持）

### jpyy.js

爬虫规则文件，定义如何从金牌影院网站获取内容：

- **host**: 金牌影院网站地址
- **url**: 获取列表的 API 地址
- **searchUrl**: 搜索 API 地址
- **一级**: 获取视频列表的规则
- **二级**: 获取视频详情的规则
- **搜索**: 搜索功能的规则
- **lazy**: 获取播放链接的规则

### jpyy.json

定义分类和过滤选项：

```json
{
  "0": [{"key": "area", "name": "地区", "value": [...]}],
  "1": [...],
  "2": [...],
  "3": [...],
  "4": [...]
}
```

- **0**: 电影的过滤选项
- **1**: 电视剧的过滤选项
- **2**: 综艺的过滤选项
- **3**: 动漫的过滤选项
- **4**: 其他内容的过滤选项

## 🔧 高级配置

### 修改网站地址

如果金牌影院网站地址变更，编辑 `drpy/js/jpyy.js`：

```javascript
host: 'https://m.sunnafh.com',  // 修改这里
```

### 自定义分类

编辑 `json/jpyy.json` 添加或修改分类选项。

## ⚠️ 常见问题

### Q: 导入后无法加载内容？

A: 
1. 检查网络连接
2. 确保金牌影院网站可以访问
3. 尝试重启 TVBox 应用

### Q: 搜索功能不工作？

A:
1. 确保已启用搜索功能（quickSearch=1）
2. 检查网络连接
3. 尝试使用不同的关键词

### Q: 无法播放视频？

A:
1. 检查播放器是否支持该格式
2. 尝试更换其他播放源
3. 检查设备的网络连接

## 📞 技术支持

- GitHub Issues: [提交问题](https://github.com/fqw000/jpyy_tvobx/issues)
- 金牌影院官网: https://m.sunnafh.com

## 📄 许可证

本项目仅供学习和研究使用，不得用于任何商业目的。

## 🙏 致谢

感谢 TVBox 社区和 drpy2 框架的支持。

---

**最后更新**: 2026-10-06  
**当前版本**: 1.0.0
