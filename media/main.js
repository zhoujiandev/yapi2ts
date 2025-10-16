// WebView JavaScript
(function() {
  console.log('main.js loaded successfully!');
  const vscode = acquireVsCodeApi();
  
  let currentCategories = [];
  let currentInterfaces = {};
  let currentTemplates = [];
  let currentProjects = [];
  let selectedInterfaces = new Set();
  // 选中的分类与搜索关键字
  let selectedCategoryId = null;
  let interfaceSearchTerm = '';

  // DOM Elements
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  const projectSelect = document.getElementById('project-select');
  const connectBtn = document.getElementById('connect-btn');
  const interfaceTree = document.getElementById('interface-tree');
  const treeToggleBtn = document.getElementById('tree-toggle-btn');
  const tableContent = document.getElementById('table-content');
  const generateTypesBtn = document.getElementById('generate-types-btn');
  const generateApiBtn = document.getElementById('generate-api-btn');
  const templateSelect = document.getElementById('template-select');
  const addTemplateBtn = document.getElementById('add-template-btn');
  const templateList = document.getElementById('template-list');
  const addProjectBtn = document.getElementById('add-project-btn');
  const projectList = document.getElementById('project-list');
  const interfaceSearchInput = document.getElementById('interface-search-input');
  const interfaceSearchBtn = document.getElementById('interface-search-btn');
  const interfaceClearBtn = document.getElementById('interface-clear-btn');

  // 状态标识映射函数
  function getStatusIndicator(status) {
    const statusMap = {
      'done': { emoji: '🟢', text: '已发布' },
      'undone': { emoji: '🟡', text: '开发中' },
      'deprecated': { emoji: '🔴', text: '已废弃' }
    };
    
    return statusMap[status] || { emoji: '🟡', text: '开发中' };
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
        showMessage('请选择项目', 'error');
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

      // 清除当前分类的选中状态，因为是全局搜索
      if (selectedCategoryId) {
        const previousSelected = document.querySelector(`.tree-item[data-category-id='${selectedCategoryId}']`);
        if (previousSelected) {
          previousSelected.classList.remove('selected');
        }
        selectedCategoryId = null;
        updateSelectedCategoryDisplay();
      }

      renderInterfaceTree(); // 根据新的搜索词重绘左侧树

      const allInterfaces = Object.values(currentInterfaces).flat();
      if (interfaceSearchTerm) {
        const filteredInterfaces = filterInterfacesByPath(allInterfaces, interfaceSearchTerm);
        renderInterfaceTable(filteredInterfaces); // 在右侧表格显示全局搜索结果
      } else {
        renderInterfaceTable(allInterfaces); // 搜索词为空，展示全部接口
      }
    };

    interfaceSearchBtn.addEventListener('click', performSearch);

    interfaceSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
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
        renderInterfaceTree();
        tableContent.innerHTML = '<div class="loading">暂无数据</div>';
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
          📁 ${category.name} (${count})
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
          <span class="interface-status" title="${statusIndicator.text}">${statusIndicator.emoji}</span>
          <span class="interface-title">${iface.title}</span>
          <div class="interface-path-container">
            <button class="copy-path-btn" data-path="${iface.path}" title="复制路径">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
              </svg>
            </button>
            <span class="interface-path">${iface.path}</span>
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

    updateGenerateButtons();
  }

  // 根据搜索关键字对接口路径进行模糊匹配过滤
  function filterInterfacesByPath(interfaces, term) {
    if (!term) {return interfaces;}
    const tokens = term.toLowerCase().split(/\s+/).filter(Boolean);
    return interfaces.filter(iface => {
      const path = String(iface.path || '').toLowerCase();
      return tokens.every(t => path.includes(t));
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
        ${template.description ? `<div class="template-description">${template.description}</div>` : ''}
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
    
    // Create modal dialog
    const modal = document.createElement('div');
    modal.className = 'template-modal';
    modal.innerHTML = `
      <div class="template-modal-content">
        <div class="template-modal-header">
          <h3>${title}</h3>
          <button class="template-modal-close">&times;</button>
        </div>
        <div class="template-modal-body">
          <div class="form-group">
            <label for="template-name">模板名称:</label>
            <input type="text" id="template-name" value="${template?.name || ''}" placeholder="请输入模板名称">
          </div>
          <div class="form-group">
            <label for="template-description">模板描述:</label>
            <input type="text" id="template-description" value="${template?.description || ''}" placeholder="请输入模板描述（可选）">
          </div>
          <div class="form-group">
            <label>支持的变量:</label>
            <div class="template-variables">
              <div class="variable-item" data-variable="{{methodName}}">
                <span class="variable-name">{{methodName}}</span>
                <span class="variable-desc">方法名称 (如: getUserInfo)</span>
                <button class="copy-btn" title="点击复制">📋</button>
              </div>
              <div class="variable-item" data-variable="{{title}}">
                <span class="variable-name">{{title}}</span>
                <span class="variable-desc">接口标题 (如: 获取用户信息)</span>
                <button class="copy-btn" title="点击复制">📋</button>
              </div>
              <div class="variable-item" data-variable="{{path}}">
                <span class="variable-name">{{path}}</span>
                <span class="variable-desc">接口路径 (如: /api/user/info)</span>
                <button class="copy-btn" title="点击复制">📋</button>
              </div>
              <div class="variable-item" data-variable="{{method}}">
                <span class="variable-name">{{method}}</span>
                <span class="variable-desc">HTTP方法大写 (如: GET, POST)</span>
                <button class="copy-btn" title="点击复制">📋</button>
              </div>
              <div class="variable-item" data-variable="{{lowerCaseMethod}}">
                <span class="variable-name">{{lowerCaseMethod}}</span>
                <span class="variable-desc">HTTP方法小写 (如: get, post)</span>
                <button class="copy-btn" title="点击复制">📋</button>
              </div>
              <div class="variable-item" data-variable="{{responseTypeName}}">
                <span class="variable-name">{{responseTypeName}}</span>
                <span class="variable-desc">响应类型名 (如: GetUserInfoResponse)</span>
                <button class="copy-btn" title="点击复制">📋</button>
              </div>
              <div class="variable-item" data-variable="{{paramsTypeName}}">
                <span class="variable-name">{{paramsTypeName}}</span>
                <span class="variable-desc">参数类型名 (如: GetUserInfoParams)</span>
                <button class="copy-btn" title="点击复制">📋</button>
              </div>
              <div class="variable-item" data-variable="{{interfaceUrl}}">
                <span class="variable-name">{{interfaceUrl}}</span>
                <span class="variable-desc">YAPI接口详情页URL</span>
                <button class="copy-btn" title="点击复制">📋</button>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label for="template-content">模板内容:</label>
            <textarea id="template-content" rows="15" placeholder="请输入模板内容">${template?.content || (currentTemplates.length > 0 ? currentTemplates[0].content : '')}</textarea>
          </div>
        </div>
        <div class="template-modal-footer">
          <button class="btn btn-secondary template-modal-cancel">取消</button>
          <button class="btn btn-primary template-modal-save">保存</button>
        </div>
      </div>
    `;

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
          btn.textContent = '✅';
          btn.style.color = '#28a745';
          setTimeout(() => {
            btn.textContent = '📋';
            btn.style.color = '';
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
          btn.textContent = '✅';
          btn.style.color = '#28a745';
          setTimeout(() => {
            btn.textContent = '📋';
            btn.style.color = '';
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
    
    // Create modal dialog
    const modal = document.createElement('div');
    modal.className = 'project-modal';
    modal.innerHTML = `
      <div class="project-modal-content">
        <div class="project-modal-header">
          <h3>${title}</h3>
          <button class="project-modal-close">&times;</button>
        </div>
        <div class="project-modal-body">
          <div class="form-group">
            <label for="project-name-input">项目名称:</label>
            <input type="text" id="project-name-input" class="form-control" value="${project ? project.name : ''}" placeholder="请输入项目名称">
          </div>
          <div class="form-group">
            <div class="label-with-help">
              <label for="project-yapi-url-input">YAPI地址:</label>
              <span class="help-icon">
                <div class="tooltip">请输入您部署的YAPI平台的完整地址，例如：http://yapi.example.com或\nhttps://yapi.example.com</div>
              </span>
            </div>
            <input type="text" id="project-yapi-url-input" class="form-control" value="${project ? project.yapiUrl : ''}" placeholder="请输入YAPI地址">
          </div>
          <div class="form-group">
            <div class="label-with-help">
              <label for="project-token-input">项目Token:</label>
              <span class="help-icon">
                <div class="tooltip">在YAPI项目设置页面可以找到项目Token，用于API接口的身份验证</div>
              </span>
            </div>
            <input type="text" id="project-token-input" class="form-control" value="${project ? project.projectToken : ''}" placeholder="请输入项目Token">
          </div>
        </div>
        <div class="project-modal-footer">
          <button class="btn btn-secondary project-modal-cancel">取消</button>
          <button class="btn btn-primary project-modal-save">保存</button>
        </div>
      </div>
    `;

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

  // Handle messages from extension
  window.addEventListener('message', event => {
    console.log('收到后端消息message--->', event.data);
    const message = event.data;

    switch (message.type) {
      case 'interfacesLoading':
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
        break;

      case 'configResult':
        connectBtn.disabled = false;
        connectBtn.textContent = '连接';
        
        if (message.success) {
          showMessage(message.message, 'success');
          saveConfig();
        } else {
          showMessage(message.message, 'error');
        }
        break;

      case 'interfacesLoaded':
        currentCategories = message.categories;
        currentInterfaces = message.interfaces;
        renderInterfaceTree();
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

      case 'configRestored':
        // 恢复配置时设置选中的项目
        if (message.projectToken) {
          // 根据projectToken找到对应的项目ID
          const project = currentProjects.find(p => p.projectToken === message.projectToken);
          if (project) {
            projectSelect.value = project.id;
            saveConfig();
          }
        }
        break;

      case 'generateTypesResult':
        // 恢复按钮状态
        generateTypesBtn.disabled = false;
        generateTypesBtn.textContent = '复制参数';
        
        if (message.success) {
          showMessage(message.message, 'success');
        } else {
          showMessage(message.message, 'error');
        }
        break;

      case 'generateApiResult':
        // 恢复按钮状态
        generateApiBtn.disabled = false;
        generateApiBtn.textContent = '复制API';
        
        if (message.success) {
          showMessage(message.message, 'success');
        } else {
          showMessage(message.message, 'error');
        }
        break;
    }
  });

  // Tree toggle functionality
  function toggleTree() {
    if (interfaceTree) {
      const isCollapsed = interfaceTree.classList.contains('collapsed');
      
      if (isCollapsed) {
        interfaceTree.classList.remove('collapsed');
        interfaceTree.classList.add('user-expanded');
      } else {
        interfaceTree.classList.add('collapsed');
        interfaceTree.classList.remove('user-expanded');
      }
    }
  }
})();