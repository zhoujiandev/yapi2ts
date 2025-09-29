// WebView JavaScript
(function() {
  console.log('main.js loaded successfully!');
  const vscode = acquireVsCodeApi();
  
  let currentCategories = [];
  let currentInterfaces = {};
  let currentTemplates = [];
  let selectedInterfaces = new Set();

  // DOM Elements
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  const yapiUrlInput = document.getElementById('yapi-url');
  const projectTokenInput = document.getElementById('project-token');
  const connectBtn = document.getElementById('connect-btn');
  const refreshBtn = document.getElementById('refresh-btn');
  const interfaceTree = document.getElementById('interface-tree');
  const tableContent = document.getElementById('table-content');
  const generateTypesBtn = document.getElementById('generate-types-btn');
  const generateApiBtn = document.getElementById('generate-api-btn');
  const templateSelect = document.getElementById('template-select');
  const addTemplateBtn = document.getElementById('add-template-btn');
  const templateList = document.getElementById('template-list');

  // Initialize
  init();

  function init() {
    setupEventListeners();
    loadConfig();
    // 请求加载模板
    vscode.postMessage({
      type: 'loadTemplates'
    });
  }

  function setupEventListeners() {
    // Tab switching
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabId = button.dataset.tab;
        switchTab(tabId);
      });
    });

    // Connect button
    connectBtn.addEventListener('click', () => {
      const yapiUrl = yapiUrlInput.value.trim();
      const projectToken = projectTokenInput.value.trim();
      
      if (!yapiUrl || !projectToken) {
        showMessage('请填写YAPI地址和项目Token', 'error');
        return;
      }

      connectBtn.disabled = true;
      connectBtn.textContent = '连接中...';

      vscode.postMessage({
        type: 'setConfig',
        yapiUrl,
        projectToken
      });
    });

    // Refresh button
    refreshBtn.addEventListener('click', () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = '刷新中...';
      
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
    if (config.yapiUrl) {yapiUrlInput.value = config.yapiUrl;}
    if (config.projectToken) {projectTokenInput.value = config.projectToken;}
  }

  function saveConfig() {
    vscode.setState({
      yapiUrl: yapiUrlInput.value,
      projectToken: projectTokenInput.value
    });
  }

  function loadTemplates() {
    vscode.postMessage({
      type: 'loadTemplates'
    });
  }

  function renderInterfaceTree() {
    if (currentCategories.length === 0) {
      interfaceTree.innerHTML = '<div class="loading">暂无数据</div>';
      return;
    }

    const html = currentCategories.map(category => {
      const interfaces = currentInterfaces[category._id] || [];
      return `
        <div class="tree-item category" data-category-id="${category._id}">
          📁 ${category.name} (${interfaces.length})
        </div>
      `;
    }).join('');

    interfaceTree.innerHTML = html;

    // Add click listeners
    interfaceTree.querySelectorAll('.tree-item.category').forEach(item => {
      item.addEventListener('click', () => {
        const categoryId = parseInt(item.dataset.categoryId);
        selectCategory(categoryId);
        
        // Update selected state
        interfaceTree.querySelectorAll('.tree-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
      });
    });
  }

  function selectCategory(categoryId) {
    const interfaces = currentInterfaces[categoryId] || [];
    renderInterfaceTable(interfaces);
  }

  function renderInterfaceTable(interfaces) {
    if (interfaces.length === 0) {
      tableContent.innerHTML = '<div class="empty-state">该分类下暂无接口</div>';
      return;
    }

    const html = interfaces.map(iface => {
      const methodClass = `method-${iface.method.toLowerCase()}`;
      const isSelected = selectedInterfaces.has(iface._id);
      
      return `
        <div class="interface-item">
          <input type="checkbox" class="interface-checkbox" 
                 data-interface-id="${iface._id}" 
                 ${isSelected ? 'checked' : ''}>
          <span class="interface-method ${methodClass}">${iface.method.toUpperCase()}</span>
          <span class="interface-title">${iface.title}</span>
          <span class="interface-path">${iface.path}</span>
        </div>
      `;
    }).join('');

    tableContent.innerHTML = html;

    // Add checkbox listeners
    tableContent.querySelectorAll('.interface-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const interfaceId = parseInt(e.target.dataset.interfaceId);
        
        if (e.target.checked) {
          selectedInterfaces.add(interfaceId);
        } else {
          selectedInterfaces.delete(interfaceId);
        }

        updateGenerateButtons();
      });
    });

    updateGenerateButtons();
  }

  function updateGenerateButtons() {
    const hasSelection = selectedInterfaces.size > 0;
    generateTypesBtn.disabled = !hasSelection;
    generateApiBtn.disabled = !hasSelection || !templateSelect.value;
  }

  function renderTemplateSelect() {
    const options = currentTemplates.map(template => 
      `<option value="${template.id}">${template.name}</option>`
    ).join('');
    
    templateSelect.innerHTML = `<option value="">选择模板</option>${options}`;
    
    templateSelect.addEventListener('change', updateGenerateButtons);
  }

  function renderTemplateList() {
    if (currentTemplates.length === 0) {
      templateList.innerHTML = '<div class="loading">暂无模板</div>';
      return;
    }

    const html = currentTemplates.map(template => `
      <div class="template-item">
        <div class="template-item-header">
          <span class="template-name">${template.name}</span>
          <div class="template-actions">
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
            <label for="template-content">模板内容:</label>
            <textarea id="template-content" rows="15" placeholder="请输入模板内容">${template?.content || getDefaultTemplateContent()}</textarea>
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

  function getDefaultTemplateContent() {
    return `/**
 * {{description}}
 */
export const {{methodName}} = ({{#if queryType}}params: {{queryType}}{{/if}}{{#if requestType}}{{#if queryType}}, {{/if}}data: {{requestType}}{{/if}}): Promise<{{responseType}}> => {
  return request({
    url: '{{path}}',
    method: '{{method}}',{{#if queryType}}
    params,{{/if}}{{#if requestType}}
    data,{{/if}}
  });
};`;
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

  // Handle messages from extension
  window.addEventListener('message', event => {
    const message = event.data;

    switch (message.type) {
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
        refreshBtn.disabled = false;
        refreshBtn.textContent = '刷新';
        
        currentCategories = message.categories;
        currentInterfaces = message.interfaces;
        renderInterfaceTree();
        break;

      case 'templatesLoaded':
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
    }
  });
})();