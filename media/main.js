// WebView JavaScript
(function() {
  console.log('main.js loaded successfully!');
  const vscode = acquireVsCodeApi();
  
  let currentCategories = [];
  let currentInterfaces = {};
  let currentTemplates = [];
  let currentProjects = [];
  let selectedInterfaces = new Set();
  let isCollabMode = false;
  let collabConfig = null;
  // 选中的分类与搜索关键字
  let selectedCategoryId = null;
  let interfaceSearchTerm = '';
  // 刷新按钮状态管理
  let isRefreshing = false;

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
  const addProjectBtn = document.getElementById('add-project-btn');
  const projectList = document.getElementById('project-list');
  const interfaceSearchInput = document.getElementById('interface-search-input');
  const interfaceSearchBtn = document.getElementById('interface-search-btn');
  const interfaceClearBtn = document.getElementById('interface-clear-btn');
  const treeSearchWrapper = document.getElementById('tree-search-wrapper');
  const collabModeSwitch = document.getElementById('collab-mode-switch');
  const collabModeStatus = document.getElementById('collab-mode-status');
  const collabConfigInfo = document.getElementById('collab-config-info');
  const projectSection = document.querySelector('.project-section');

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
        showMessage('请先选择一个项目，如果还没有配置项目，请切换到"我的项目"标签页进行配置', 'error');
        return;
      }

      // 协同模式下使用协同配置
      if (selectedProject === 'collab-project') {
        if (!collabConfig || !collabConfig.yapiUrl || !collabConfig.projectToken) {
          showMessage('协同模式配置不完整，请检查 .vscode/settings.json', 'error');
          return;
        }
        
        connectBtn.disabled = true;
        connectBtn.textContent = '连接中...';

        vscode.postMessage({
          type: 'setConfig',
          yapiUrl: collabConfig.yapiUrl,
          projectToken: collabConfig.projectToken
        });
        return;
      }

      // 从项目列表中找到选中的项目
      const project = currentProjects.find(p => p.id === selectedProject);
      if (!project) {
        showMessage('未找到选中的项目', 'error');
        return;
      }

      connectBtn.disabled = true;
      connectBtn.textContent = '连接中...';

      vscode.postMessage({
        type: 'setConfig',
        yapiUrl: project.yapiUrl,
        projectToken: project.projectToken
      });
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
      generateTypesBtn.textContent = '生成中...';

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
      generateApiBtn.textContent = '生成中...';

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
      const originalText = generateAllBtn.textContent;
      generateAllBtn.textContent = '生成中...';

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

    // Add project button
    addProjectBtn.addEventListener('click', () => {
      showProjectEditor();
    });

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

    // 协同模式开关事件监听
    if (collabModeSwitch) {
      collabModeSwitch.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        vscode.postMessage({
          type: 'setCollabMode',
          enabled: enabled
        });
      });
    }

    // 协同模式引导卡片中的复制按钮
    const guideCopyBtn = document.querySelector('.guide-card .copy-btn');
    if (guideCopyBtn) {
      guideCopyBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const code = `"yapi2ts.collaboration": {
  "yapiUrl": "http://yapi.example.com",
  "projectToken": "your-token"
}`;
        
        navigator.clipboard.writeText(code).then(() => {
          const originalHTML = guideCopyBtn.innerHTML;
          guideCopyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          setTimeout(() => {
            guideCopyBtn.innerHTML = originalHTML;
          }, 1500);
        }).catch(() => {
          // 降级方案
          const textArea = document.createElement('textarea');
          textArea.value = code;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          
          const originalHTML = guideCopyBtn.innerHTML;
          guideCopyBtn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          setTimeout(() => {
            guideCopyBtn.innerHTML = originalHTML;
          }, 1500);
        });
      });
    }
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
    } else if (tabId === 'projects') {
      // 请求加载项目
      vscode.postMessage({
        type: 'loadProjects'
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
      
      return `
        <div class="interface-item">
          <input type="checkbox" class="interface-checkbox" 
                 data-interface-id="${iface._id}" 
                 ${isSelected ? 'checked' : ''}>
          <span class="interface-method ${methodClass}">${iface.method.toUpperCase()}</span>
          <span class="interface-status" title="${statusIndicator.text}">${statusIndicator.html}</span>
          <span class="interface-title">${iface.title}</span>
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
    generateTypesBtn.disabled = !hasSelection;
    generateApiBtn.disabled = !hasSelection || !templateSelect.value;
    
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
  function renderProjectSelect() {
    const defaultOption = '<option value="">选择项目</option>';
    const options = currentProjects.map(project => 
      `<option value="${project.id}">${project.name}</option>`
    ).join('');
    
    projectSelect.innerHTML = defaultOption + options;
  }

  function renderProjectList() {
    if (currentProjects.length === 0) {
      projectList.innerHTML = '<div class="loading">暂无项目</div>';
      return;
    }

    const html = currentProjects.map(project => `
      <div class="project-item">
        <div class="project-item-header">
          <span class="project-name">${project.name}</span>
          <div class="project-actions">
            <button class="btn btn-secondary edit-project-btn" data-project-id="${project.id}">编辑</button>
            <button class="btn btn-secondary delete-project-btn" data-project-id="${project.id}">删除</button>
          </div>
        </div>
        <div class="project-info">
          <div class="project-url">YAPI地址: ${project.yapiUrl}</div>
          <div class="project-token">项目Token: ${project.projectToken.substring(0, 10)}...</div>
          <div class="project-time">创建时间: ${new Date(project.createdAt).toLocaleString()}</div>
        </div>
      </div>
    `).join('');

    projectList.innerHTML = html;

    // 添加事件监听器
    projectList.querySelectorAll('.edit-project-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const projectId = e.target.dataset.projectId;
        editProject(projectId);
      });
    });

    projectList.querySelectorAll('.delete-project-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const projectId = e.target.dataset.projectId;
        deleteProject(projectId);
      });
    });
  }

  function showProjectEditor(project = null) {
    const isEdit = !!project;
    const title = isEdit ? '编辑项目' : '新增项目';
    
    // Create modal dialog using HTML template
    const modal = document.createElement('div');
    modal.className = 'project-modal';
    
    const projectContent = createFromTemplate('project-editor-modal-template', {
      title,
      projectName: project?.name || '',
      yapiUrl: project?.yapiUrl || '',
      projectToken: project?.projectToken || ''
    });
    
    modal.appendChild(projectContent);
    document.body.appendChild(modal);

    // Event listeners
    const closeBtn = modal.querySelector('.project-modal-close');
    const cancelBtn = modal.querySelector('.project-modal-cancel');
    const saveBtn = modal.querySelector('.project-modal-save');
    const nameInput = modal.querySelector('#project-name-input');
    const yapiUrlInput = modal.querySelector('#project-yapi-url-input');
    const tokenInput = modal.querySelector('#project-token-input');

    const closeModal = () => {
      document.body.removeChild(modal);
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    saveBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      const yapiUrl = yapiUrlInput.value.trim();
      const projectToken = tokenInput.value.trim();

      if (!name || !yapiUrl || !projectToken) {
        showMessage('请填写完整的项目信息', 'error');
        return;
      }

      const projectData = {
        id: project ? project.id : generateId(),
        name,
        yapiUrl,
        projectToken,
        createdAt: project ? project.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      vscode.postMessage({
        type: 'saveProject',
        project: projectData
      });

      closeModal();
    });

    // Handle escape key
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);
  }

  function editProject(projectId) {
    const project = currentProjects.find(p => p.id === projectId);
    if (project) {
      showProjectEditor(project);
    }
  }

  function deleteProject(projectId) {
    showConfirmDialog('确定要删除这个项目吗？', () => {
      vscode.postMessage({
        type: 'deleteProject',
        projectId
      });
    });
  }

  function loadProjects() {
    vscode.postMessage({
      type: 'loadProjects'
    });
  }

  // 更新协同模式UI
  function updateCollabModeUI() {
    if (collabModeSwitch) {
      collabModeSwitch.checked = isCollabMode;
    }

    const collabGuideContainer = document.getElementById('collab-guide-container');

    if (collabModeStatus) {
      if (isCollabMode) {
        // 协同模式开启
        if (collabConfig && collabConfig.yapiUrl && collabConfig.projectToken) {
          // 有配置信息
          collabModeStatus.style.display = 'block';
          if (collabGuideContainer) {
            collabGuideContainer.style.display = 'none';
          }
          
          collabModeStatus.classList.remove('error');
          collabModeStatus.querySelector('.collab-status-icon').innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>';
          collabModeStatus.querySelector('.collab-status-text').textContent = '协同模式已开启，配置来自 .vscode/settings.json';
          
          if (collabConfigInfo) {
            collabConfigInfo.innerHTML = `
              <div class="config-item">
                <span class="config-label">YAPI地址:</span>
                <span class="config-value">${collabConfig.yapiUrl}</span>
              </div>
              <div class="config-item">
                <span class="config-label">Token:</span>
                <span class="config-value">${collabConfig.projectToken.substring(0, 10)}...</span>
              </div>
            `;
          }
        } else {
          // 无配置信息
          collabModeStatus.style.display = 'none';
          if (collabGuideContainer) {
            collabGuideContainer.style.display = 'block';
          }
        }
      } else {
        // 协同模式关闭
        collabModeStatus.style.display = 'none';
        if (collabGuideContainer) {
          collabGuideContainer.style.display = 'none';
        }
      }
    }

    // 切换项目列表显示
    if (projectSection) {
      if (isCollabMode) {
        projectSection.classList.add('collab-mode-active');
      } else {
        projectSection.classList.remove('collab-mode-active');
      }
    }

    // 更新项目选择下拉框
    updateProjectSelectForCollabMode();
  }

  // 协同模式下更新项目选择
  function updateProjectSelectForCollabMode() {
    const collabHint = document.getElementById('collab-hint');
    
    if (isCollabMode) {
      // 禁用下拉框
      projectSelect.disabled = true;
      projectSelect.classList.add('disabled');

      if (collabConfig && collabConfig.yapiUrl && collabConfig.projectToken) {
        // 协同模式下，添加一个虚拟的协同项目选项
        let collabOption = projectSelect.querySelector('option[value="collab-project"]');
        if (!collabOption) {
          collabOption = document.createElement('option');
          collabOption.value = 'collab-project';
          collabOption.textContent = '📁 协同项目 (settings.json)';
          // 插入到"选择项目"后面
          const firstOption = projectSelect.querySelector('option[value=""]');
          if (firstOption && firstOption.nextSibling) {
            projectSelect.insertBefore(collabOption, firstOption.nextSibling);
          } else {
            projectSelect.appendChild(collabOption);
          }
        }
        projectSelect.value = 'collab-project';
        
        // 显示成功提示
        if (collabHint) {
          collabHint.style.display = 'block';
          collabHint.className = 'collab-hint success';
          collabHint.textContent = '已开启协同模式，正在使用 .vscode/settings.json 中的配置';
        }
      } else {
        projectSelect.value = "";
        
        // 显示配置提醒
        if (collabHint) {
          collabHint.style.display = 'block';
          collabHint.className = 'collab-hint warning';
          collabHint.textContent = '已开启协同模式，但未检测到配置。请切换到"我的项目"标签页查看';
          
          const link = document.createElement('a');
          link.textContent = '配置指南';
          link.href = '#';
          link.style.marginLeft = '4px';
          link.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('projects');
          });
          collabHint.appendChild(link);
        }
      }
    } else {
      // 非协同模式，移除协同项目选项
      projectSelect.disabled = false;
      projectSelect.classList.remove('disabled');
      
      const collabOption = projectSelect.querySelector('option[value="collab-project"]');
      if (collabOption) {
        collabOption.remove();
      }
      
      // 隐藏提示
      if (collabHint) {
        collabHint.style.display = 'none';
      }
    }
  }

  // Code Preview Modal Functions
  function showCodePreview(code, type = 'api') {
    const modal = document.createElement('div');
    modal.className = 'code-preview-modal';
    
    const previewContent = createFromTemplate('code-preview-modal-template', {});
    modal.appendChild(previewContent);
    document.body.appendChild(modal);

    const codeDisplay = modal.querySelector('#preview-code-display');
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
    codeDisplay.textContent = code;
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
          codeDisplay.textContent = codeEditor.value;
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

      case 'projectsLoaded':
        currentProjects = message.projects;
        renderProjectSelect();
        renderProjectList();
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
        generateTypesBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> 仅类型定义`;
        
        if (message.success) {
          showMessage(message.message, 'success');
        } else {
          showMessage(message.message, 'error');
        }
        break;

      case 'generateApiResult':
        // 恢复按钮状态
        generateApiBtn.disabled = false;
        generateApiBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> 仅API代码`;
        
        if (message.success) {
          showMessage(message.message, 'success');
        } else {
          showMessage(message.message, 'error');
        }
        break;

      case 'generateAllResult':
        // 恢复按钮状态
        generateAllBtn.disabled = false;
        generateAllBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code-2 btn-icon"><path d="m18 16 4-4-4-4"></path><path d="m6 8-4 4 4 4"></path><path d="m14.5 4-5 16"></path></svg>生成完整代码';
        
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