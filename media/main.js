// WebView JavaScript
(function() {
  console.log('main.js loaded successfully!');
  const vscode = acquireVsCodeApi();
  
  let currentCategories = [];
  let currentInterfaces = {};
  let currentTemplates = [];
  let currentProjects = [];
  let selectedInterfaces = new Set();
  let selectedProjectId = null;
  // 选中的分类与搜索关键字
  let selectedCategoryId = null;
  let interfaceSearchTerm = '';
  // 刷新按钮状态管理
  let isRefreshing = false;
  let fetchingInterfaceIds = new Set();

  // DOM Elements
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  const projectSelect = document.getElementById('project-select');
  const connectBtn = document.getElementById('connect-btn');
  const refreshBtn = document.getElementById('refresh-btn');
  const interfaceTree = document.getElementById('interface-tree');
  const treeToggleBtn = document.getElementById('tree-toggle-btn');
  const tableContent = document.getElementById('table-content');
  const generateTypesBtn = document.getElementById('generate-types-btn');
  const generateApiBtn = document.getElementById('generate-api-btn');
  const generateAllBtn = document.getElementById('generate-all-btn');
  const templateSelect = document.getElementById('template-select');
  const addTemplateBtn = document.getElementById('add-template-btn');
  const templateList = document.getElementById('template-list');
  const interfaceSearchInput = document.getElementById('interface-search-input');
  const interfaceSearchBtn = document.getElementById('interface-search-btn');
  const interfaceClearBtn = document.getElementById('interface-clear-btn');
  const treeSearchWrapper = document.getElementById('tree-search-wrapper');

  /**
   * 格式化时间戳为相对时间或简短日期格式
   * @param {number} timestamp - 秒级时间戳
   * @returns {string} 格式化后的时间描述
   */
  function getFriendlyTime(timestamp) {
    if (!timestamp) {
      return '-';
    }
    const ms = timestamp * 1000;
    const now = Date.now();
    const diff = now - ms;

    if (diff < 0) {
      return formatShortDate(ms);
    }

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return '刚刚';
    } else if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else if (days < 3) {
      if (days === 1) {
        return '昨天';
      }
      return '前天';
    } else {
      return formatShortDate(ms);
    }
  }

  /**
   * 格式化日期为简短格式 (例如: 07-10)
   * @param {number} ms - 毫秒级时间戳
   * @returns {string}
   */
  function formatShortDate(ms) {
    const date = new Date(ms);
    const now = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    if (date.getFullYear() === now.getFullYear()) {
      return `${month}-${day}`;
    } else {
      return `${date.getFullYear()}-${month}-${day}`;
    }
  }

  /**
   * 格式化日期为完整格式 (例如: 2026-07-10 17:59:35)
   * @param {number} timestamp - 秒级时间戳
   * @returns {string}
   */
  function getFullDateTime(timestamp) {
    if (!timestamp) {
      return '-';
    }
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  // 状态标识映射函数
  function getStatusIndicator(status) {
    const statusMap = {
      'done': { html: '<span class="status-dot status-done" title="已发布"></span>', text: '已发布' },
      'undone': { html: '<span class="status-dot status-undone" title="开发中"></span>', text: '开发中' },
      'deprecated': { html: '<span class="status-dot status-deprecated" title="已废弃"></span>', text: '已废弃' }
    };
    
    return statusMap[status] || { html: '<span class="status-dot status-undone" title="开发中"></span>', text: '开发中' };
  }

  /**
   * 从 HTML <template> 标签创建 DOM 元素并填充数据
   * @param {string} templateId - 模板元素的 ID
   * @param {Object} data - 要填充的数据对象
   * @returns {HTMLElement} 克隆并填充数据后的 DOM 元素
   */
  function createFromTemplate(templateId, data = {}) {
    const template = document.getElementById(templateId);
    if (!template) {
      console.error(`Template not found: ${templateId}`);
      return null;
    }
    
    const clone = template.content.cloneNode(true);
    
    // 填充带有 data-field 属性的元素
    Object.keys(data).forEach(key => {
      const elements = clone.querySelectorAll(`[data-field="${key}"]`);
      elements.forEach(el => {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.value = data[key] || '';
        } else {
          el.textContent = data[key] || '';
        }
      });
    });
    
    return clone;
  }

  // Initialize
  init();

  function init() {
    console.log('前端初始化开始...');
    setupEventListeners();
    loadConfig();
    // 请求加载模板
    console.log('请求加载模板...');
    vscode.postMessage({
      type: 'loadTemplates'
    });
    // 请求加载项目
    console.log('请求加载项目...');
    vscode.postMessage({
      type: 'loadProjects'
    });
    console.log('前端初始化完成');
  }

  function setupEventListeners() {
    // Tab switching
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.dataset.tab;
        switchTab(tabId);
      });
    });

    // Tree toggle button
    if (treeToggleBtn) {
      treeToggleBtn.addEventListener('click', () => {
        toggleTree();
      });
    }

    // Connect button
    connectBtn.addEventListener('click', () => {
      const selectedProject = projectSelect.value;
      
      if (!selectedProject) {
        showMessage('请先选择一个项目', 'error');
        return;
      }

      connectProject(selectedProject);
    });

    // Dropdown change listener to auto-connect and save config
    projectSelect.addEventListener('change', () => {
      const selectedProject = projectSelect.value;
      if (selectedProject) {
        saveConfig();
        connectProject(selectedProject);
      }
    });

    // Refresh button
    refreshBtn.addEventListener('click', () => {
      if (isRefreshing) {return;} // 防止重复点击
      
      isRefreshing = true;
      refreshBtn.disabled = true;
      const refreshIcon = document.getElementById('refresh-icon');
      if (refreshIcon) {
        refreshIcon.classList.add('spinning');
      }

      vscode.postMessage({
        type: 'loadInterfaces'
      });
    });

    // Generate buttons
    generateTypesBtn.addEventListener('click', () => {
      if (selectedInterfaces.size === 0) {
        showMessage('请选择要生成的接口', 'error');
        return;
      }

      // 设置loading状态
      generateTypesBtn.disabled = true;
      generateTypesBtn.classList.add('loading');

      vscode.postMessage({
        type: 'generateTypes',
        interfaceIds: Array.from(selectedInterfaces)
      });
    });

    generateApiBtn.addEventListener('click', () => {
      if (selectedInterfaces.size === 0) {
        showMessage('请选择要生成的接口', 'error');
        return;
      }

      const templateId = templateSelect.value;
      if (!templateId) {
        showMessage('请选择模板', 'error');
        return;
      }

      // 设置loading状态
      generateApiBtn.disabled = true;
      generateApiBtn.classList.add('loading');

      vscode.postMessage({
        type: 'generateApi',
        interfaceIds: Array.from(selectedInterfaces),
        templateId
      });
    });

    // Generate all button - 一键生成完整代码
    generateAllBtn.addEventListener('click', () => {
      if (selectedInterfaces.size === 0) {
        showMessage('请选择要生成的接口', 'error');
        return;
      }

      const templateId = templateSelect.value;
      if (!templateId) {
        showMessage('请选择模板', 'error');
        return;
      }

      // 设置loading状态
      generateAllBtn.disabled = true;
      generateAllBtn.classList.add('loading');

      vscode.postMessage({
        type: 'generateAll',
        interfaceIds: Array.from(selectedInterfaces),
        templateId
      });
    });

    // Add template button
    addTemplateBtn.addEventListener('click', () => {
      showTemplateEditor();
    });

    // Open settings button
    const openSettingsBtn = document.getElementById('open-settings-btn');
    if (openSettingsBtn) {
      openSettingsBtn.addEventListener('click', () => {
        vscode.postMessage({
          type: 'openSettings'
        });
      });
    }

    // Copy config template button
    const copyConfigTemplateBtn = document.getElementById('copy-config-template-btn');
    if (copyConfigTemplateBtn) {
      copyConfigTemplateBtn.addEventListener('click', async () => {
        const code = `"yapi2ts.projects": [
  {
    "id": "my-project",
    "name": "我的项目",
    "yapiUrl": "http://yapi.example.com"
  }
]`;
        try {
          await navigator.clipboard.writeText(code);
          const originalHTML = copyConfigTemplateBtn.innerHTML;
          copyConfigTemplateBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          setTimeout(() => {
            copyConfigTemplateBtn.innerHTML = originalHTML;
          }, 1500);
        } catch (err) {
          const textArea = document.createElement('textarea');
          textArea.value = code;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          showMessage('复制成功', 'success');
        }
      });
    }

    // 搜索功能
    const performSearch = () => {
      interfaceSearchTerm = interfaceSearchInput.value.trim();

      // 如果搜索关键词为空，不执行搜索
      if (!interfaceSearchTerm) {
        return;
      }

      // 清除当前分类的选中状态，因为是全局搜索
      if (selectedCategoryId) {
        const previousSelected = document.querySelector(`.tree-item[data-category-id='${selectedCategoryId}']`);
        if (previousSelected) {
          previousSelected.classList.remove('selected');
        }
        selectedCategoryId = null;
        updateSelectedCategoryDisplay();
      }

      // 清空所有已选中的接口
      selectedInterfaces.clear();
      // 更新生成按钮状态和选中数量显示
      updateGenerateButtons();

      renderInterfaceTree(); // 根据新的搜索词重绘左侧树

      const allInterfaces = Object.values(currentInterfaces).flat();
      const filteredInterfaces = filterInterfacesByPath(allInterfaces, interfaceSearchTerm);
      renderInterfaceTable(filteredInterfaces); // 在右侧表格显示全局搜索结果
    };

    // 更新搜索按钮状态
    const updateSearchButtonState = () => {
      const searchTerm = interfaceSearchInput.value.trim();
      interfaceSearchBtn.disabled = !searchTerm;
    };

    // 初始化搜索按钮状态
    updateSearchButtonState();

    interfaceSearchBtn.addEventListener('click', performSearch);

    interfaceSearchInput.addEventListener('input', updateSearchButtonState);

    interfaceSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !interfaceSearchBtn.disabled) {
        performSearch();
      }
    });

    // 清空搜索
    if (interfaceClearBtn) {
      interfaceClearBtn.addEventListener('click', () => {
        interfaceSearchInput.value = '';
        interfaceSearchTerm = '';
        // 清除选中分类，展示全部接口
        if (selectedCategoryId) {
          const previousSelected = document.querySelector(`.tree-item[data-category-id='${selectedCategoryId}']`);
          if (previousSelected) {
            previousSelected.classList.remove('selected');
          }
          selectedCategoryId = null;
          updateSelectedCategoryDisplay();
        }
        // 清除选中的接口
        selectedInterfaces.clear();
        // 更新选中数量显示
        updateGenerateButtons();
        renderInterfaceTree();
        tableContent.innerHTML = '<div class="loading">暂无数据</div>';
      });
    }

    // 复制模板示例按钮事件监听器
    const copyTemplateExampleBtn = document.querySelector('.copy-btn[title="复制示例代码"]');
    if (copyTemplateExampleBtn) {
      copyTemplateExampleBtn.addEventListener('click', copyTemplateExample);
    }

    // Removed unused collab mode switch listeners
  }

  // 复制模板示例函数
  function copyTemplateExample() {
    const templateExample = document.getElementById('template-example');
    if (templateExample) {
      const content = templateExample.textContent;
      vscode.postMessage({
        type: 'copyTemplateExample',
        content: content
      });
    }
  }

  function switchTab(tabId) {
    // Update tab buttons
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Update tab contents
    tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabId}-tab`);
    });

    // Load data for specific tabs
    if (tabId === 'templates') {
      // 请求加载模板
      vscode.postMessage({
        type: 'loadTemplates'
      });
    }
  }

  function loadConfig() {
    // Load saved config from VSCode settings
    const config = vscode.getState() || {};
    if (config.selectedProjectId) {
      // 设置选中的项目
      projectSelect.value = config.selectedProjectId;
    }
  }

  function saveConfig() {
    vscode.setState({
      selectedProjectId: projectSelect.value
    });
  }

  function loadTemplates() {
    vscode.postMessage({
      type: 'loadTemplates'
    });
  }

  function renderInterfaceTree() {
    const treeContent = interfaceTree.querySelector('.tree-content');
    if (!treeContent) {return;}
    
    if (currentCategories.length === 0) {
      treeContent.innerHTML = '<div class="loading">暂无数据</div>';
      return;
    }

    const html = currentCategories.map(category => {
      const interfaces = currentInterfaces[category._id] || [];
      const filtered = filterInterfacesByPath(interfaces, interfaceSearchTerm);
      const count = interfaceSearchTerm ? filtered.length : interfaces.length;
      if (interfaceSearchTerm && count === 0) {return ''};
      const isSelected = Number(selectedCategoryId) === Number(category._id);
      return `
        <div class="tree-item category ${isSelected ? 'selected' : ''}" data-category-id="${category._id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-folder tree-icon"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg> ${category.name}
        </div>
      `;
    }).join('');

    treeContent.innerHTML = html;

    // Add click listeners
    treeContent.querySelectorAll('.tree-item.category').forEach(item => {
      item.addEventListener('click', () => {
        const categoryId = parseInt(item.dataset.categoryId);
        selectCategory(categoryId);
      });
    });
  }

  function selectCategory(categoryId) {
    // 如果当前正在进行全局搜索，则选择分类时应清除搜索词
    if (interfaceSearchTerm) {
      interfaceSearchInput.value = '';
      interfaceSearchTerm = '';
      renderInterfaceTree(); // 清除搜索后，重绘完整的树
    }

    // 切换目录时清空所有选中的接口
    selectedInterfaces.clear();

    if (selectedCategoryId) {
      const previousSelected = document.querySelector(`.tree-item[data-category-id='${selectedCategoryId}']`);
      if (previousSelected) {
        previousSelected.classList.remove('selected');
      }
    }
    selectedCategoryId = categoryId;
    const selectedElement = document.querySelector(`.tree-item[data-category-id='${categoryId}']`);
    if (selectedElement) {
      selectedElement.classList.add('selected');
    }

    // 更新选中目录的显示
    updateSelectedCategoryDisplay();

    const interfaces = currentInterfaces[categoryId] || [];
    renderInterfaceTable(interfaces);
  }

  function renderInterfaceTable(interfaces) {
    if (interfaces.length === 0) {
      tableContent.innerHTML = '<div class="empty-state">该分类下暂无接口</div>';
      return;
    }

    // 检查是否全选
    const allSelected = interfaces.length > 0 && interfaces.every(iface => selectedInterfaces.has(iface._id));
    const someSelected = interfaces.some(iface => selectedInterfaces.has(iface._id));

    const tableHeader = `
      <div class="interface-table-header">
        <input type="checkbox" class="select-all-checkbox" 
               ${allSelected ? 'checked' : ''} 
               ${someSelected && !allSelected ? 'data-indeterminate="true"' : ''}>
        <span class="header-method">方法</span>
        <span class="header-title">接口名称</span>
        <span class="header-path">路径</span>
      </div>
    `;

    const interfaceRows = interfaces.map(iface => {
      const methodClass = `method-${iface.method.toLowerCase()}`;
      const isSelected = selectedInterfaces.has(iface._id);
      const statusIndicator = getStatusIndicator(iface.status);
      const friendlyTime = getFriendlyTime(iface.up_time || iface.add_time);
      const fullTime = getFullDateTime(iface.up_time || iface.add_time);
      
      return `
        <div class="interface-item">
          <input type="checkbox" class="interface-checkbox" 
                 data-interface-id="${iface._id}" 
                 ${isSelected ? 'checked' : ''}>
          <span class="interface-method ${methodClass}">${iface.method.toUpperCase()}</span>
          <span class="interface-status" title="${statusIndicator.text}">${statusIndicator.html}</span>
          <div class="interface-title">
            <span class="interface-title-text">${iface.title}</span>
            <span class="interface-time-tag" title="最后修改时间：${fullTime}">${friendlyTime}</span>
          </div>
          <div class="interface-path-container">
            <span class="interface-path">${iface.path}</span>
            <button class="preview-code-btn" data-interface-id="${iface._id}" title="预览代码">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"/>
                <path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8zm8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
              </svg>
            </button>
            <button class="copy-path-btn" data-path="${iface.path}" title="复制路径">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
              </svg>
            </button>
            <button class="copy-yapi-url-btn" data-interface-id="${iface._id}" title="复制YAPI接口地址">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.5 3a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    tableContent.innerHTML = tableHeader + interfaceRows;

    // 触发缺失更新时间的接口详情异步加载
    const missingDetailIds = interfaces
      .filter(iface => iface.up_time === undefined && !fetchingInterfaceIds.has(iface._id))
      .map(iface => iface._id);

    if (missingDetailIds.length > 0) {
      missingDetailIds.forEach(id => fetchingInterfaceIds.add(id));
      vscode.postMessage({
        type: 'fetchInterfaceDetails',
        interfaceIds: missingDetailIds
      });
    }

    // 设置半选状态
    const selectAllCheckbox = tableContent.querySelector('.select-all-checkbox');
    if (someSelected && !allSelected) {
      selectAllCheckbox.indeterminate = true;
    }

    // 添加全选复选框事件监听
    selectAllCheckbox.addEventListener('change', (e) => {
      const isChecked = e.target.checked;
      
      interfaces.forEach(iface => {
        if (isChecked) {
          selectedInterfaces.add(iface._id);
        } else {
          selectedInterfaces.delete(iface._id);
        }
      });

      // 更新所有接口复选框状态
      tableContent.querySelectorAll('.interface-checkbox').forEach(checkbox => {
        const interfaceId = parseInt(checkbox.dataset.interfaceId);
        checkbox.checked = selectedInterfaces.has(interfaceId);
      });

      updateGenerateButtons();
    });

    // Add checkbox listeners
    tableContent.querySelectorAll('.interface-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const interfaceId = parseInt(e.target.dataset.interfaceId);
        
        if (e.target.checked) {
          selectedInterfaces.add(interfaceId);
        } else {
          selectedInterfaces.delete(interfaceId);
        }

        // 更新全选复选框状态
        const selectAllCheckbox = tableContent.querySelector('.select-all-checkbox');
        const allSelected = interfaces.every(iface => selectedInterfaces.has(iface._id));
        const someSelected = interfaces.some(iface => selectedInterfaces.has(iface._id));
        
        selectAllCheckbox.checked = allSelected;
        selectAllCheckbox.indeterminate = someSelected && !allSelected;

        updateGenerateButtons();
      });
    });

    // Add copy path button listeners
    tableContent.querySelectorAll('.copy-path-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const path = e.currentTarget.dataset.path;
        
        // 发送消息给VSCode扩展处理复制和显示提示
        vscode.postMessage({
          type: 'copyPath',
          path: path
        });
      });
    });

    // Add copy YAPI URL button listeners
    tableContent.querySelectorAll('.copy-yapi-url-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const interfaceId = e.currentTarget.dataset.interfaceId;
        
        // 发送消息给VSCode扩展处理复制YAPI地址
        vscode.postMessage({
          type: 'copyYapiUrl',
          interfaceId: interfaceId
        });
      });
    });

    // Add preview code button listeners
    tableContent.querySelectorAll('.preview-code-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const interfaceId = parseInt(e.currentTarget.dataset.interfaceId);
        const templateId = templateSelect.value;
        
        if (!templateId) {
          showMessage('请先选择模板', 'error');
          return;
        }
        
        // 发送消息给VSCode扩展处理代码预览
        vscode.postMessage({
          type: 'previewCode',
          interfaceIds: [interfaceId],
          templateId: templateId
        });
      });
    });

    updateGenerateButtons();
  }

  // 根据搜索关键字对接口ID或路径进行模糊匹配过滤
  function filterInterfacesByPath(interfaces, term) {
    if (!term) {return interfaces;}
    const trimmedTerm = term.trim();
    
    // 如果是纯数字，优先按接口ID精确匹配
    if (/^\d+$/.test(trimmedTerm)) {
      const targetId = parseInt(trimmedTerm, 10);
      const idMatch = interfaces.filter(iface => iface._id === targetId);
      if (idMatch.length > 0) {
        return idMatch;
      }
    }
    
    // 按路径进行模糊匹配
    const tokens = trimmedTerm.toLowerCase().split(/\s+/).filter(Boolean);
    return interfaces.filter(iface => {
      const path = String(iface.path || '').toLowerCase();
      const id = String(iface._id || '');
      // 匹配路径或ID包含搜索词
      return tokens.every(t => path.includes(t) || id.includes(t));
    });
  }

  function updateGenerateButtons() {
    const hasSelection = selectedInterfaces.size > 0;
    if (!generateTypesBtn.classList.contains('loading')) {
      generateTypesBtn.disabled = !hasSelection;
    }
    if (!generateApiBtn.classList.contains('loading')) {
      generateApiBtn.disabled = !hasSelection || !templateSelect.value;
    }
    
    // 更新选中数量显示
    const selectedCountElement = document.getElementById('selected-count');
    if (selectedCountElement) {
      selectedCountElement.textContent = `(已选中 ${selectedInterfaces.size} 个)`;
    }
  }

  function updateSelectedCategoryDisplay() {
    const selectedCategoryElement = document.getElementById('selected-category');
    if (selectedCategoryElement) {
      if (selectedCategoryId) {
        const selectedCategory = currentCategories.find(cat => cat._id === selectedCategoryId);
        if (selectedCategory) {
          selectedCategoryElement.textContent = `[${selectedCategory.name}]`;
        } else {
          selectedCategoryElement.textContent = '';
        }
      } else {
        selectedCategoryElement.textContent = '';
      }
    }
  }

  function renderTemplateSelect() {
    const options = currentTemplates.map(template => 
      `<option value="${template.id}">${template.name}</option>`
    ).join('');
    
    templateSelect.innerHTML = `<option value="">选择模板</option>${options}`;
    
    templateSelect.addEventListener('change', updateGenerateButtons);
  }

  function renderTemplateList() {
    console.log('renderTemplateList', currentTemplates);
    if (currentTemplates.length === 0) {
      templateList.innerHTML = '<div class="loading">暂无模板</div>';
      return;
    }

    const html = currentTemplates.map(template => `
      <div class="template-item">
        <div class="template-item-header">
          <span class="template-name">${template.name}</span>
          <div class="template-actions">
            <button class="btn btn-secondary copy-template-btn" data-template-id="${template.id}" title="复制模板内容">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
              </svg>
              复制
            </button>
            <button class="btn btn-secondary edit-template-btn" data-template-id="${template.id}">编辑</button>
            <button class="btn btn-secondary delete-template-btn" data-template-id="${template.id}">删除</button>
          </div>
        </div>
        ${template.description ? `<div class="template-item-description">${template.description}</div>` : ''}
        <div class="template-content">${template.content}</div>
      </div>
    `).join('');

    templateList.innerHTML = html;

    // 添加事件监听器
    templateList.querySelectorAll('.copy-template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const templateId = e.target.closest('.copy-template-btn').dataset.templateId;
        const template = currentTemplates.find(t => t.id === templateId);
        
        if (template) {
          // 发送消息给VSCode扩展处理复制模板内容
          vscode.postMessage({
            type: 'copyTemplate',
            content: template.content
          });
        }
      });
    });

    templateList.querySelectorAll('.edit-template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const templateId = e.target.dataset.templateId;
        editTemplate(templateId);
      });
    });

    templateList.querySelectorAll('.delete-template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const templateId = e.target.dataset.templateId;
        deleteTemplate(templateId);
      });
    });
  }

  function showTemplateEditor(template = null) {
    const isEdit = !!template;
    const title = isEdit ? '编辑模板' : '新增模板';
    
    // Create modal dialog using HTML template
    const modal = document.createElement('div');
    modal.className = 'template-modal';
    
    const templateContent = createFromTemplate('template-editor-modal-template', {
      title,
      templateName: template?.name || '',
      templateDescription: template?.description || '',
      templateContent: template?.content || (currentTemplates.length > 0 ? currentTemplates[0].content : '')
    });
    
    modal.appendChild(templateContent);
    document.body.appendChild(modal);

    // Event listeners
    const closeBtn = modal.querySelector('.template-modal-close');
    const cancelBtn = modal.querySelector('.template-modal-cancel');
    const saveBtn = modal.querySelector('.template-modal-save');
    const nameInput = modal.querySelector('#template-name');
    const descriptionInput = modal.querySelector('#template-description');
    const contentTextarea = modal.querySelector('#template-content');

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // 添加变量复制功能
    const copyButtons = modal.querySelectorAll('.copy-btn');
    copyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const variableItem = btn.closest('.variable-item');
        const variable = variableItem.dataset.variable;
        
        // 复制到剪贴板
        navigator.clipboard.writeText(variable).then(() => {
          // 显示复制成功提示
          btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          setTimeout(() => {
            btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
          }, 1000);
        }).catch(() => {
          // 降级方案：使用传统方法复制
          const textArea = document.createElement('textarea');
          textArea.value = variable;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          // 显示复制成功提示
          btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          setTimeout(() => {
            btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
          }, 1000);
        });
      });
    });

    saveBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      const description = descriptionInput.value.trim();
      const content = contentTextarea.value.trim();

      if (!name) {
        showMessage('请输入模板名称', 'error');
        return;
      }

      if (!content) {
        showMessage('请输入模板内容', 'error');
        return;
      }

      const templateData = {
        id: template?.id || generateId(),
        name,
        description,
        content
      };

      vscode.postMessage({
        type: 'saveTemplate',
        template: templateData
      });

      closeModal();
    });

    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }

  // 自定义确认对话框
  function showConfirmDialog(message, onConfirm, onCancel) {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    
    // 创建对话框
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';
    
    // 创建消息内容
    const messageEl = document.createElement('div');
    messageEl.className = 'confirm-message';
    messageEl.textContent = message;
    
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'confirm-buttons';
    
    // 创建确认按钮
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'confirm-btn confirm-btn-primary';
    confirmBtn.textContent = '确定';
    confirmBtn.onclick = () => {
      document.body.removeChild(overlay);
      if (onConfirm) {onConfirm();}
    };
    
    // 创建取消按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'confirm-btn confirm-btn-secondary';
    cancelBtn.textContent = '取消';
    cancelBtn.onclick = () => {
      document.body.removeChild(overlay);
      if (onCancel) {onCancel();}
    };
    
    // 组装对话框
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);
    dialog.appendChild(messageEl);
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);
    
    // 添加到页面
    document.body.appendChild(overlay);
    
    // 点击遮罩层关闭
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        if (onCancel) {onCancel();}
      }
    };
    
    // ESC键关闭
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', handleKeydown);
        if (onCancel) {onCancel();}
      }
    };
    document.addEventListener('keydown', handleKeydown);
  }

  function deleteTemplate(templateId) {
    showConfirmDialog('确定要删除这个模板吗？', () => {
      vscode.postMessage({
        type: 'deleteTemplate',
        templateId
      });
    });
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  function showMessage(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3000);
    
    // Also log to console for debugging
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  function editTemplate(templateId) {
    const template = currentTemplates.find(t => t.id === templateId);
    if (template) {
      showTemplateEditor(template);
    }
  }

  // Project management functions
  function connectProject(projectId) {
    if (!projectId) {return;}
    const project = currentProjects.find(p => p.id === projectId);
    if (!project) {
      showMessage('未找到选中的项目', 'error');
      return;
    }

    connectBtn.disabled = true;
    connectBtn.textContent = '连接中...';

    vscode.postMessage({
      type: 'setConfig',
      yapiUrl: project.yapiUrl,
      projectToken: project.projectToken || '',
      projectId: project.id,
      projectName: project.name
    });
  }

  function renderProjectSelect() {
    const noConfigGuide = document.getElementById('no-config-guide');
    const configSection = document.querySelector('.config-section');
    const interfaceSection = document.querySelector('.interface-section');
    
    if (!currentProjects || currentProjects.length === 0) {
      if (noConfigGuide) {noConfigGuide.style.display = 'block';}
      if (configSection) {configSection.style.display = 'none';}
      if (interfaceSection) {interfaceSection.style.display = 'none';}
      return;
    }
    
    if (noConfigGuide) {noConfigGuide.style.display = 'none';}
    if (configSection) {configSection.style.display = 'block';}
    if (interfaceSection) {interfaceSection.style.display = 'flex';}

    const defaultOption = '<option value="">选择项目</option>';
    const options = currentProjects.map(project => 
      `<option value="${project.id}">${project.name}</option>`
    ).join('');
    
    projectSelect.innerHTML = defaultOption + options;
    
    // Auto restore last selected project, or auto select if there is only one
    if (selectedProjectId && currentProjects.some(p => p.id === selectedProjectId)) {
      projectSelect.value = selectedProjectId;
      connectProject(selectedProjectId);
    } else if (currentProjects.length === 1) {
      projectSelect.value = currentProjects[0].id;
      connectProject(currentProjects[0].id);
    }
  }

  // Helper to find foldable ranges in code (braces and block comments)
  function findFoldRanges(code) {
    const lines = code.split(/\r?\n/);
    const ranges = [];
    
    let inString = null;
    let inLineComment = false;
    let inBlockComment = false;
    let blockCommentStartLine = -1;
    const braceStack = [];
    
    let lineIdx = 0;
    let i = 0;
    while (i < code.length) {
      const char = code[i];
      const nextChar = code[i + 1];
      
      if (char === '\n') {
        lineIdx++;
        inLineComment = false;
        i++;
        continue;
      }
      if (char === '\r') {
        if (nextChar === '\n') {
          lineIdx++;
          inLineComment = false;
          i += 2;
        } else {
          lineIdx++;
          inLineComment = false;
          i++;
        }
        continue;
      }
      
      if (inString === null) {
        if (inLineComment) {
          i++;
          continue;
        }
        if (inBlockComment) {
          if (char === '*' && nextChar === '/') {
            inBlockComment = false;
            if (lineIdx > blockCommentStartLine) {
              ranges.push({ start: blockCommentStartLine, end: lineIdx, type: 'comment' });
            }
            i += 2;
          } else {
            i++;
          }
          continue;
        }
        
        if (char === '/' && nextChar === '/') {
          inLineComment = true;
          i += 2;
          continue;
        }
        if (char === '/' && nextChar === '*') {
          inBlockComment = true;
          blockCommentStartLine = lineIdx;
          i += 2;
          continue;
        }
      }
      
      if (inString !== null) {
        if (char === '\\') {
          i += 2;
        } else if (char === inString) {
          inString = null;
          i++;
        } else {
          i++;
        }
        continue;
      }
      
      if (char === '"' || char === "'" || char === '`') {
        inString = char;
        i++;
        continue;
      }
      
      if (char === '{') {
        braceStack.push(lineIdx);
      } else if (char === '}') {
        if (braceStack.length > 0) {
          const startLine = braceStack.pop();
          if (lineIdx > startLine) {
            ranges.push({ start: startLine, end: lineIdx, type: 'brace' });
          }
        }
      }
      
      i++;
    }
    
    return ranges;
  }

  // Helper to render code with editor-like features (line numbers, inline indent guides, toggle chevrons)
  function renderFoldableCode(container, code) {
    container.innerHTML = '';
    
    const lines = code.split(/\r?\n/);
    const ranges = findFoldRanges(code);
    
    // Detect indent size
    let indentSize = 2; // Default to 2
    let minIndent = Infinity;
    lines.forEach(line => {
      const leadingSpaces = line.match(/^ */)[0].length;
      if (leadingSpaces > 0 && leadingSpaces < minIndent) {
        minIndent = leadingSpaces;
      }
    });
    if (minIndent !== Infinity && minIndent > 0) {
      indentSize = minIndent;
    }
    
    // Pre-calculate indentation level of each line
    const lineIndents = lines.map(line => {
      const leadingSpaces = line.match(/^ */)[0].length;
      return Math.floor(leadingSpaces / indentSize);
    });
    
    // Map start line -> end line for folding
    const rangeMap = new Map();
    ranges.forEach(r => {
      const currentEnd = rangeMap.get(r.start);
      if (currentEnd === undefined || r.end > currentEnd) {
        rangeMap.set(r.start, r.end);
      }
    });
    
    const foldedLines = new Set();
    const rowElements = [];
    
    lines.forEach((lineText, idx) => {
      const row = document.createElement('div');
      row.className = 'editor-row';
      row.dataset.line = idx;
      
      const gutter = document.createElement('div');
      gutter.className = 'gutter-cell';
      
      const lineNum = document.createElement('div');
      lineNum.className = 'line-number-gutter';
      lineNum.textContent = idx + 1;
      gutter.appendChild(lineNum);
      
      const foldToggleGutter = document.createElement('div');
      foldToggleGutter.className = 'fold-toggle-gutter';
      
      if (rangeMap.has(idx)) {
        const toggle = document.createElement('span');
        toggle.className = 'fold-toggle';
        toggle.innerHTML = `
          <svg viewBox="0 0 16 16" fill="currentColor">
            <path d="M7.9 10.07a.5.5 0 0 1-.35-.15L3.65 6.02a.5.5 0 1 1 .7-.71L8 8.97l3.65-3.66a.5.5 0 1 1 .7.71l-3.9 3.9a.5.5 0 0 1-.55.15z"/>
          </svg>
        `;
        toggle.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleFold(idx);
        });
        foldToggleGutter.appendChild(toggle);
      } else {
        const placeholder = document.createElement('span');
        placeholder.style.width = '22px';
        placeholder.style.height = '22px';
        foldToggleGutter.appendChild(placeholder);
      }
      
      gutter.appendChild(foldToggleGutter);
      row.appendChild(gutter);
      
      const lineCell = document.createElement('div');
      lineCell.className = 'line-cell';
      
      // Render inline indentation cells and guidelines
      const indentCount = lineIndents[idx];
      const leadingSpaces = indentCount * indentSize;
      
      for (let col = 0; col < indentCount; col++) {
        const indentCell = document.createElement('div');
        indentCell.className = 'indent-cell';
        
        // Is there an active range spanning line `idx` (r.start < idx <= r.end)
        // whose start line has indentation level `col`?
        const activeRange = ranges.find(r => {
          return r.start < idx && idx <= r.end && lineIndents[r.start] === col;
        });
        
        if (activeRange) {
          const guideLine = document.createElement('div');
          guideLine.className = 'indent-guide-line';
          if (activeRange.end === idx) {
            guideLine.classList.add('guideline-end');
          }
          indentCell.appendChild(guideLine);
        }
        
        lineCell.appendChild(indentCell);
      }
      
      const lineSpan = document.createElement('span');
      lineSpan.className = 'line-text';
      // Strip leading spaces since they are rendered via indent cells
      lineSpan.textContent = lineText.substring(leadingSpaces) || ' ';
      lineCell.appendChild(lineSpan);
      
      if (rangeMap.has(idx)) {
        const indicator = document.createElement('span');
        indicator.className = 'fold-indicator';
        indicator.textContent = '...';
        indicator.addEventListener('click', (e) => {
          e.stopPropagation();
          toggleFold(idx);
        });
        lineCell.appendChild(indicator);
      }
      
      row.appendChild(lineCell);
      container.appendChild(row);
      rowElements.push(row);
    });
    
    function toggleFold(startLine) {
      if (foldedLines.has(startLine)) {
        foldedLines.delete(startLine);
      } else {
        foldedLines.add(startLine);
      }
      updateVisibility();
    }
    
    function updateVisibility() {
      rowElements.forEach((row, idx) => {
        let isLineVisible = true;
        for (const start of foldedLines) {
          const end = rangeMap.get(start);
          if (idx > start && idx <= end) {
            isLineVisible = false;
            break;
          }
        }
        
        if (isLineVisible) {
          row.style.display = 'flex';
        } else {
          row.style.display = 'none';
        }
        
        if (rangeMap.has(idx)) {
          const toggleElements = row.querySelectorAll('.fold-toggle');
          if (foldedLines.has(idx)) {
            row.classList.add('folded-line');
            toggleElements.forEach(el => {
              el.classList.add('collapsed');
            });
          } else {
            row.classList.remove('folded-line');
            toggleElements.forEach(el => {
              el.classList.remove('collapsed');
            });
          }
        }
      });
    }

    container.addEventListener('mouseover', (e) => {
      const gutterCell = e.target.closest('.gutter-cell');
      if (gutterCell) {
        container.classList.add('gutter-hovered');
      } else {
        container.classList.remove('gutter-hovered');
      }
    });
    
    container.addEventListener('mouseleave', () => {
      container.classList.remove('gutter-hovered');
    });
  }

  // Code Preview Modal Functions
  function showCodePreview(code, type = 'api') {
    const modal = document.createElement('div');
    modal.className = 'code-preview-modal';
    
    const previewContent = createFromTemplate('code-preview-modal-template', {});
    modal.appendChild(previewContent);
    document.body.appendChild(modal);

    const codeContainer = modal.querySelector('#preview-code-container');
    const codeEditor = modal.querySelector('#preview-code-editor');
    const closeBtn = modal.querySelector('.code-preview-modal-close');
    const cancelBtn = modal.querySelector('.code-preview-modal-cancel');
    const copyBtn = modal.querySelector('.code-preview-copy-btn');
    
    if (copyBtn && !copyBtn.querySelector('svg')) {
      copyBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
          <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
          <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
        </svg>
        复制代码
      `;
    }
    const previewTabBtns = modal.querySelectorAll('.preview-tab-btn');
    const viewTab = modal.querySelector('#preview-view-tab');
    const editTab = modal.querySelector('#preview-edit-tab');

    // 设置初始代码
    renderFoldableCode(codeContainer, code);
    codeEditor.value = code;

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    // 标签页切换
    previewTabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabType = btn.dataset.tab;
        
        previewTabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        if (tabType === 'view') {
          viewTab.style.display = 'block';
          editTab.style.display = 'none';
          // 同步编辑器的内容到预览
          renderFoldableCode(codeContainer, codeEditor.value);
        } else {
          viewTab.style.display = 'none';
          editTab.style.display = 'block';
        }
      });
    });

    // 关闭按钮
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // 复制按钮
    copyBtn.addEventListener('click', () => {
      const currentCode = codeEditor.value;
      
      navigator.clipboard.writeText(currentCode).then(() => {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" style="margin-right: 4px; display: inline-block; vertical-align: middle;"><polyline points="20 6 9 17 4 12"></polyline></svg>已复制';
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
        }, 2000);
        showMessage('代码已复制到剪贴板', 'success');
      }).catch(() => {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = currentCode;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check" style="margin-right: 4px; display: inline-block; vertical-align: middle;"><polyline points="20 6 9 17 4 12"></polyline></svg>已复制';
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
        }, 2000);
        showMessage('代码已复制到剪贴板', 'success');
      });
    });

    // 点击遮罩层关闭
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // ESC键关闭
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);
  }

  // 监听窗口大小变化事件
  window.addEventListener('resize', function() {
    const interfaceTree = document.querySelector('.interface-tree');
    if (interfaceTree) {
      // 当窗口大小变化时，清除所有手动操作状态，让媒体查询接管
      interfaceTree.classList.remove('user-expanded', 'user-collapsed');
    }
  });

  // Handle messages from extension
  window.addEventListener('message', event => {
    console.log('收到后端消息message--->', event.data);
    const message = event.data;

    switch (message.type) {
      case 'interfaceDetailsLoaded': {
        const details = message.details || [];
        details.forEach(detail => {
          fetchingInterfaceIds.delete(detail._id);
          for (const catId in currentInterfaces) {
            const list = currentInterfaces[catId];
            const found = list.find(i => i._id === detail._id);
            if (found) {
              found.up_time = detail.up_time;
              found.add_time = detail.add_time;
              break;
            }
          }
        });
        if (selectedCategoryId) {
          const interfaces = currentInterfaces[selectedCategoryId] || [];
          renderInterfaceTable(interfaces);
        } else if (interfaceSearchTerm) {
          const allInterfaces = Object.values(currentInterfaces).flat();
          const filteredInterfaces = filterInterfacesByPath(allInterfaces, interfaceSearchTerm);
          renderInterfaceTable(filteredInterfaces);
        }
        break;
      }

      case 'expandTree':
        // 连接成功后展开树目录
        if (interfaceTree) {
          interfaceTree.classList.remove('user-collapsed');
          interfaceTree.classList.add('user-expanded');
        }
        break;

      case 'interfacesLoading':
        // 清除搜索关键字与输入框内容
        interfaceSearchTerm = '';
        if (interfaceSearchInput) {
          interfaceSearchInput.value = '';
        }
        // 隐藏搜索框
        if (treeSearchWrapper) {
          treeSearchWrapper.style.display = 'none';
        }
        // 展示加载中状态
        tableContent.innerHTML = '<div class="loading">暂无数据</div>';
        selectedCategoryId = null;
        updateSelectedCategoryDisplay();
        if (interfaceTree) {
          const treeContent = interfaceTree.querySelector('.tree-content');
          if (treeContent) {
            treeContent.innerHTML = '<div class="loading">正在加载接口...</div>';
          }
        }
        // 设置刷新按钮为loading状态
        if (!isRefreshing) {
          isRefreshing = true;
          refreshBtn.disabled = true;
          const refreshIcon = document.getElementById('refresh-icon');
          if (refreshIcon) {
            refreshIcon.classList.add('spinning');
          }
        }
        break;

      case 'configResult':
        connectBtn.disabled = false;
        connectBtn.textContent = '连接';
        
        if (message.success) {
          showMessage(message.message, 'success');
          saveConfig();
          // 连接成功后显示刷新按钮
          refreshBtn.style.display = 'inline-flex';
        } else {
          showMessage(message.message, 'error');
          // 连接失败时隐藏刷新按钮
          refreshBtn.style.display = 'none';
        }
        break;

      case 'interfacesLoaded':
        currentCategories = message.categories;
        currentInterfaces = message.interfaces;
        
        // 更新项目名称显示
        const projectNameElement = document.getElementById('project-name');
        if (projectNameElement) {
          if (message.projectInfo) {
            // 获取当前选中的项目配置
            const selectedProject = projectSelect.value;
            const project = currentProjects.find(p => p.id === selectedProject);
            
            let displayText = '';
            let fullText = '';
            
            if (project) {
              // 显示格式：我的项目名-yapi平台项目名
              displayText = `(${project.name}-${message.projectInfo.name})`;
              fullText = `${project.name}-${message.projectInfo.name}`;
            } else {
              // 如果找不到项目配置，只显示yapi平台项目名
              displayText = `(${message.projectInfo.name})`;
              fullText = message.projectInfo.name;
            }
            
            projectNameElement.textContent = displayText;
            projectNameElement.title = fullText; // 设置tooltip显示完整内容
          } else {
            // 没有项目信息时清空
            projectNameElement.textContent = '';
            projectNameElement.title = '';
          }
        }
        
        // 更新时间显示
        const lastUpdateTimeElement = document.getElementById('last-update-time');
        if (lastUpdateTimeElement && message.updateTime) {
          const updateDate = new Date(message.updateTime);
          const timeStr = updateDate.toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          lastUpdateTimeElement.textContent = `更新于 ${timeStr}`;
          lastUpdateTimeElement.title = `上次更新时间: ${updateDate.toLocaleString('zh-CN')}`;
        }
        
        renderInterfaceTree();
        // 显示搜索框
        if (treeSearchWrapper) {
          treeSearchWrapper.style.display = 'block';
        }
        // 恢复刷新按钮状态
        if (isRefreshing) {
          isRefreshing = false;
          refreshBtn.disabled = false;
          const refreshIcon = document.getElementById('refresh-icon');
          if (refreshIcon) {
            refreshIcon.classList.remove('spinning');
          }
        }
        break;

      case 'projectsLoaded':
      case 'collabConfigChanged':
        currentProjects = message.projects || [];
        renderProjectSelect();
        break;

      case 'collabConfigInvalid':
        currentProjects = [];
        renderProjectSelect();
        break;

      case 'interfacesLoadFailed':
        // 加载失败，显示错误并清理加载状态
        if (interfaceTree) {
          const treeContent = interfaceTree.querySelector('.tree-content');
          if (treeContent) {
            treeContent.innerHTML = '<div class="loading">加载接口失败</div>';
          }
        }
        if (tableContent) {
          tableContent.innerHTML = '';
        }
        if (message.error) {
          showMessage(`加载接口失败: ${message.error}`, 'error');
        }
        // 隐藏搜索框
        if (treeSearchWrapper) {
          treeSearchWrapper.style.display = 'none';
        }
        // 恢复刷新按钮状态
        if (isRefreshing) {
          isRefreshing = false;
          refreshBtn.disabled = false;
          const refreshIcon = document.getElementById('refresh-icon');
          if (refreshIcon) {
            refreshIcon.classList.remove('spinning');
          }
        }
        break;

      case 'templatesLoaded':
        console.log('处理templatesLoaded消息，模板数量:', message.templates.length);
        currentTemplates = message.templates;
        renderTemplateSelect();
        renderTemplateList();
        break;


      case 'templateSaved':
        loadTemplates();
        showMessage('模板保存成功', 'success');
        break;

      case 'templateDeleted':
        loadTemplates();
        showMessage('模板删除成功', 'success');
        break;

      case 'projectSaved':
        loadProjects();
        showMessage('项目保存成功', 'success');
        break;

      case 'projectDeleted':
        loadProjects();
        showMessage('项目删除成功', 'success');
        break;

      case 'collabModeChanged':
        isCollabMode = message.enabled;
        collabConfig = message.config;
        updateCollabModeUI();
        break;

      case 'configRestored':
        // 恢复配置时设置选中的项目
        if (message.projectToken) {
          // 根据projectToken找到对应的项目ID
          const project = currentProjects.find(p => p.projectToken === message.projectToken);
          if (project) {
            projectSelect.value = project.id;
            saveConfig();
            // 如果有有效的配置，显示刷新按钮
            refreshBtn.style.display = 'inline-flex';
          }
        }
        break;

      case 'generateTypesResult':
        // 恢复按钮状态
        generateTypesBtn.disabled = false;
        generateTypesBtn.classList.remove('loading');
        
        if (message.success) {
          showMessage(message.message, 'success');
        } else {
          showMessage(message.message, 'error');
        }
        break;

      case 'generateApiResult':
        // 恢复按钮状态
        generateApiBtn.disabled = false;
        generateApiBtn.classList.remove('loading');
        
        if (message.success) {
          showMessage(message.message, 'success');
        } else {
          showMessage(message.message, 'error');
        }
        break;

      case 'generateAllResult':
        // 恢复按钮状态
        generateAllBtn.disabled = false;
        generateAllBtn.classList.remove('loading');
        
        if (message.success) {
          showMessage(message.message, 'success');
        } else {
          showMessage(message.message, 'error');
        }
        break;

      case 'notification':
        // 处理来自后端的通知消息
        showMessage(message.message, message.notificationType);
        break;

      case 'codePreviewResult':
        // 显示代码预览模态框
        if (message.success && message.code) {
          showCodePreview(message.code, message.codeType);
        } else {
          showMessage(message.message || '生成代码失败', 'error');
        }
        break;
    }
  });

  // Tree toggle functionality
  function toggleTree() {
    if (interfaceTree) {
      const hasUserExpanded = interfaceTree.classList.contains('user-expanded');
      const hasUserCollapsed = interfaceTree.classList.contains('user-collapsed');
      
      // 清除所有状态类
      interfaceTree.classList.remove('user-expanded', 'user-collapsed');
      
      if (hasUserCollapsed) {
        // 当前是用户手动收缩状态，切换到展开
        interfaceTree.classList.add('user-expanded');
      } else if (hasUserExpanded) {
        // 当前是用户手动展开状态，切换到收缩
        interfaceTree.classList.add('user-collapsed');
      } else {
        // 当前处于媒体查询控制状态，需要根据实际显示状态判断
        const computedStyle = window.getComputedStyle(interfaceTree);
        const currentWidth = parseInt(computedStyle.width);
        
        if (currentWidth <= 40) {
          // 当前是收缩状态（媒体查询控制），切换到展开
          interfaceTree.classList.add('user-expanded');
        } else {
          // 当前是展开状态，切换到收缩
          interfaceTree.classList.add('user-collapsed');
        }
      }
    }
  }
})();