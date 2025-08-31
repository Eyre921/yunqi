document.addEventListener('DOMContentLoaded', () => {

    const WORKS_PER_ROW = 10; // 定义每一行固定的作品数量
    const UPDATE_INTERVAL = 60000; // 统一设置为60秒（1分钟）更新一次

    // --- 模拟后端API ---
    // 这是一个模拟函数，您需要用真实的API请求替换它。
    // 它返回一个包含作品对象的数组。
    async function mockFetchWorks(sortBy = 'createdAt', limit = 10) {
        console.log(`Fetching works, sorted by ${sortBy}...`);
        const demoImagePool = [
            "https://images.unsplash.com/photo-1678107353913-c6d51375d8d0?w=800&q=80",
            "https://images.unsplash.com/photo-1679083216832-683a936a57d0?w=800&q=80",
            "https://images.unsplash.com/photo-1679482139042-49122588390c?w=800&q=80",
            "https://images.unsplash.com/photo-1678096338423-9366e66e2a2a?w=800&q=80",
            "https://images.unsplash.com/photo-1678833444073-f1afe39e3b56?w=800&q=80",
            "https://images.unsplash.com/photo-1679083216584-6a97b2e3e57f?w=800&q=80",
            "https://images.unsplash.com/photo-1679083216531-89d70104a37b?w=800&q=80",
            "https://images.unsplash.com/photo-1678733792019-90691b0b75a1?w=800&q=80",
            "https://images.unsplash.com/photo-1679083216857-e3f2824e8d02?w=800&q=80",
            "https://images.unsplash.com/photo-1678096338521-1e289381283d?w=800&q=80"
        ];
        // 模拟数据变化
        const works = Array.from({ length: limit }, (_, i) => ({
            id: `${sortBy}-${Date.now()}-${i}`,
            title: `作品标题 ${i + 1}`,
            author: `作者 ${String.fromCharCode(65 + i)}`,
            prompt: `这是一个模拟的prompt，随机数: ${Math.random()}`,
            imageUrl: demoImagePool[Math.floor(Math.random() * demoImagePool.length)], // 随机取一张图
            likeCount: Math.floor(Math.random() * 200)
        }));
        return works;
    }

    // --- 核心更新函数 ---
    function populateMarquee(containerId, worksData) {
        const track = document.querySelector(`#${containerId} .marquee-track`);
        if (!track) return;
        
        // 保证数据不多于规定数量
        const displayWorks = worksData.slice(0, WORKS_PER_ROW);

        // 为了无缝滚动，复制一份数据
        const combinedWorks = [...displayWorks, ...displayWorks];
        
        track.innerHTML = ''; // 清空旧内容
        combinedWorks.forEach(work => {
            const card = document.createElement('a');
            card.className = 'work-card';
            card.href = "javascript:void(0)";
            const img = document.createElement('img');
            img.src = work.imageUrl;
            img.loading = 'lazy';
            card.appendChild(img);
            // 点击卡片显示详情（此处为简化版）
            card.addEventListener('click', () => {
                 document.getElementById('detailModal').classList.add('visible');
                 // 您可以在这里填充更详细的作品数据到详情弹窗中
            });
            track.appendChild(card);
        });
    }
    
    // --- 定时获取并刷新所有数据 ---
    async function fetchAllDataAndUpdateUI() {
        try {
            // 获取最新作品数据并更新UI
            const latestWorks = await mockFetchWorks('createdAt', WORKS_PER_ROW);
            populateMarquee('latest-works', latestWorks);

            // 获取热门作品数据并更新UI (分两行展示)
            const popularWorks = await mockFetchWorks('likeCount', WORKS_PER_ROW * 2);
            populateMarquee('popular-works-1', popularWorks.slice(0, WORKS_PER_ROW));
            populateMarquee('popular-works-2', popularWorks.slice(WORKS_PER_ROW, WORKS_PER_ROW * 2));

        } catch (error) {
            console.error("更新数据失败:", error);
        }
    }
    
    // --- 初始化和定时器 ---
    // 1. 页面加载后立即执行一次，避免页面空白
    fetchAllDataAndUpdateUI(); 
    
    // 2. 设置定时器，按照您希望的频率重复执行
    setInterval(fetchAllDataAndUpdateUI, UPDATE_INTERVAL);
    
    // --- 其他UI逻辑 (弹窗, 计数器等) ---
    // PRD 2.3: 模拟在线人数
    const onlineCountEl = document.getElementById('online-count');
    let currentCount = 1024;
    setInterval(() => {
        currentCount += Math.floor(Math.random() * 5) + 1;
        onlineCountEl.textContent = currentCount;
    }, 10000);

    // PRD 2.1 & 2.2: 弹窗处理
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadModal = document.getElementById('uploadModal');
    const detailModal = document.getElementById('detailModal');
    
    function setupModal(modalId) {
        const modal = document.getElementById(modalId);
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => modal.classList.remove('visible'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('visible');
        });
    }
    setupModal('uploadModal');
    setupModal('detailModal');
    
    uploadBtn.addEventListener('click', () => uploadModal.classList.add('visible'));

    // PRD 2.3: 互动与轻提示
    const toastEl = document.getElementById('toast-notification');
    function showToast(message) {
        toastEl.textContent = message;
        toastEl.classList.add('show');
        setTimeout(() => {
            toastEl.classList.remove('show');
        }, 3000);
    }
    
    const publishBtn = document.getElementById('publishBtn');
    publishBtn.addEventListener('click', () => {
        publishBtn.textContent = '发布中...';
        publishBtn.disabled = true;
        // 模拟后端请求
        setTimeout(() => {
            uploadModal.classList.remove('visible');
            showToast('作品已提交审核，请耐心等待！');
            publishBtn.textContent = '发布';
            publishBtn.disabled = false;
        }, 1500);
    });
    
    document.getElementById('copyPromptBtn').addEventListener('click', function() {
        const promptText = document.getElementById('detail-prompt').textContent;
        navigator.clipboard.writeText(promptText).then(() => {
            this.textContent = '已复制!';
            showToast('复制成功');
            setTimeout(() => { this.textContent = '复制Prompt'; }, 2000);
        });
    });

    // PRD 2.1: 字符计数器
    function setupCharCounter(inputId) {
        const input = document.getElementById(inputId);
        const counter = input.parentElement.querySelector('.char-counter');
        const max = input.maxLength;
        input.addEventListener('input', () => {
            counter.textContent = `${input.value.length} / ${max}`;
        });
    }
    setupCharCounter('work-title');
    setupCharCounter('author-name');
    setupCharCounter('prompt');
});