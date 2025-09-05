document.addEventListener('DOMContentLoaded', () => {

    const WORKS_PER_ROW = 10; // 桌面端跑马灯每行基础作品数
    const UPDATE_INTERVAL = 60000; // 数据更新间隔

    // --- 模拟后端API ---
    async function mockFetchWorks(sortBy = 'createdAt', limit = 10, page = 1) {
        console.log(`Fetching works, sorted by ${sortBy}, page ${page}, limit ${limit}...`);
        await new Promise(resolve => setTimeout(resolve, 300));

        // 使用本地图片池
        const localImagePool = [];
        for (let i = 1; i <= 52; i++) {
            const imageNumber = i.toString().padStart(3, '0');
            localImagePool.push(`images/DM_20250831112136_${imageNumber}.PNG`);
        }
        
        const titlePool = ["赛博朋克城市夜景", "梦幻森林仙境", "未来科技概念图", "抽象艺术创作", "古典建筑风光", "现代艺术装置", "自然风景摄影", "人物肖像画", "动物世界探索", "宇宙星空奇观", "海底世界冒险", "山川河流美景", "城市建筑群", "花卉植物特写", "科幻机器人", "魔幻奇幻世界", "复古怀旧风格", "极简主义设计", "色彩斑斓抽象", "黑白摄影艺术", "数字艺术创新", "传统文化元素", "现代时尚设计", "工业风格建筑", "田园乡村风光", "都市夜生活", "艺术雕塑作品", "创意平面设计", "手绘插画作品", "3D渲染艺术", "水彩画创作", "油画经典作品", "素描人物像", "版画艺术", "陶瓷工艺品", "金属雕塑", "玻璃艺术品", "纺织艺术", "珠宝设计", "家具设计", "建筑模型", "景观设计", "室内装饰", "服装设计", "产品设计", "UI界面设计", "品牌标识", "包装设计", "海报设计", "书籍装帧"];
        const authorPool = ["张艺术", "李创意", "王设计", "赵画家", "陈摄影", "刘雕塑", "杨建筑", "周时尚", "吴数码", "郑传统", "孙现代", "朱抽象", "胡写实", "林印象", "何极简", "高复古", "梁科幻", "宋自然", "唐都市", "冯艺匠", "邓创客", "曹视觉", "彭色彩", "曾光影", "萧构图", "薛质感", "范美学", "雷灵感", "贺创新", "倪经典", "汤前卫", "滕实验", "殷概念", "罗表现", "毕技法", "郝风格", "邬主题", "安意境", "常节奏", "乐韵律", "于平衡", "时对比", "傅统一", "皮变化", "卞重点", "齐细节", "康整体", "伍局部", "余空间", "元层次", "卜深度", "顾广度", "孟高度", "平角度", "黄温度", "和湿度"];

        const totalItems = 100;
        const totalPages = Math.ceil(totalItems / limit);
        if (page > totalPages) return [];

        const startIndex = (page - 1) * limit;
        const endIndex = Math.min(startIndex + limit, totalItems);
        const actualLimit = endIndex - startIndex;

        const works = Array.from({ length: actualLimit }, (_, i) => {
            const globalIndex = startIndex + i;
            return {
                id: `${sortBy}-${page}-${Date.now()}-${i}`,
                title: titlePool[globalIndex % titlePool.length],
                author: authorPool[globalIndex % authorPool.length],
                prompt: `这是第${globalIndex + 1}个${sortBy === 'popularity' ? '热门' : '最新'}作品的创作提示词。`,
                imageUrl: localImagePool[globalIndex % localImagePool.length],
                likeCount: Math.floor(Math.random() * 500) + (sortBy === 'popularity' ? 200 : 50) + globalIndex
            };
        });
        return works;
    }

    // --- Layout Management ---
    function setupLayout() {
        const isMobile = window.innerWidth <= 768;
        setupPopularWorks(isMobile);
        populateLatestWorks(isMobile);
    }

    function populateLatestWorks(isMobile) {
        mockFetchWorks('createdAt', 20).then(worksData => {
            populateMarquee('latest-works', worksData, isMobile);
        });
    }

    function setupPopularWorks(isMobile) {
        const wrapper = document.getElementById('popular-works-wrapper');
        if (!wrapper) return;

        wrapper.innerHTML = '';
        if (window.infiniteScrollObserver) {
            window.infiniteScrollObserver.disconnect();
        }

        if (isMobile) {
            // 移动端：网格布局 + 无限滚动
            wrapper.innerHTML = `
                <div class="popular-works-grid" id="popular-works-grid"></div>
                <div class="loading-indicator" id="loading-indicator" style="display: none;">
                    <div class="spinner"></div><p>加载更多作品中...</p>
                </div>
                <div class="no-more-content" id="no-more-content" style="display: none;">
                    <p>已经到底了，没有更多作品了</p>
                </div>`;
            initInfiniteScroll();
            loadPopularWorks(1, true);
        } else {
            // 桌面端：也使用无限滚动，但保持跑马灯样式
            wrapper.innerHTML = `
                <div class="popular-works-desktop-grid" id="popular-works-desktop-grid"></div>
                <div class="loading-indicator" id="loading-indicator" style="display: none;">
                    <div class="spinner"></div><p>加载更多作品中...</p>
                </div>
                <div class="no-more-content" id="no-more-content" style="display: none;">
                    <p>已经到底了，没有更多作品了</p>
                </div>`;
            initInfiniteScroll();
            loadPopularWorks(1, true);
        }
    }

    // 修改 loadPopularWorks 函数以支持桌面端
    async function loadPopularWorks(page = 1, isInitial = false) {
        if (isLoading) return;
        isLoading = true;
        const loadingIndicator = document.getElementById('loading-indicator');
        const noMoreContent = document.getElementById('no-more-content');
        if (loadingIndicator) loadingIndicator.style.display = 'flex';

        try {
            const works = await mockFetchWorks('popularity', ITEMS_PER_PAGE, page);
            if (works.length === 0) {
                hasMoreContent = false;
                if (noMoreContent) noMoreContent.style.display = 'block';
                return;
            }
            
            // 根据设备类型选择不同的容器
            const isMobile = window.innerWidth <= 768;
            const grid = document.getElementById(isMobile ? 'popular-works-grid' : 'popular-works-desktop-grid');
            if (!grid) return;
            
            if (isInitial) {
                grid.innerHTML = '';
                currentPage = 1;
                hasMoreContent = true;
                if (noMoreContent) noMoreContent.style.display = 'none';
            }
            
            works.forEach(work => {
                const card = createWorkCard(work, isMobile);
                grid.appendChild(card);
            });
            
            if (works.length < ITEMS_PER_PAGE) {
                hasMoreContent = false;
                if (noMoreContent) noMoreContent.style.display = 'block';
            }
        } catch (error) {
            console.error('加载热门作品失败:', error);
            showToast('加载失败，请稍后重试');
        } finally {
            isLoading = false;
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        }
    }

    function loadMorePopularWorks() {
        currentPage++;
        loadPopularWorks(currentPage, false);
    }

    // --- Marquee Population (Desktop) ---
    function populateMarquee(containerId, worksData, isMobile) {
        const track = document.querySelector(`#${containerId} .marquee-track`);
        if (!track) return;
        const displayWorks = worksData.slice(0, WORKS_PER_ROW * 2);
        const combinedWorks = [...displayWorks, ...displayWorks];
        track.innerHTML = '';
        combinedWorks.forEach(work => {
            const card = createWorkCard(work, isMobile);
            track.appendChild(card);
        });
    }

    // --- Generic Card Creation ---
    function createWorkCard(work, isMobile) {
        const card = document.createElement('a');
        card.className = 'work-card';
        card.href = "javascript:void(0)";
        if (isMobile) {
            card.innerHTML = `
                <img src="${work.imageUrl}" alt="${work.name}" loading="lazy">
            <div class="work-info">
            <h3 title="${work.name}">${work.name}</h3>
                    <p title="by ${work.author} • ❤️ ${work.likeCount}">by ${work.author} • ❤️ ${work.likeCount}</p>
                </div>`;
        } else {
            card.innerHTML = `<img src="${work.imageUrl}" alt="${work.name}" loading="lazy">`;
        }
        card.addEventListener('click', () => showWorkDetail(work));
        return card;
    }

    // --- Modals, Toasts, and other UI components ---
    const uploadModal = document.getElementById('uploadModal');
    const detailModal = document.getElementById('detailModal');
    const uploadBtn = document.getElementById('uploadBtn');
    const closeBtns = document.querySelectorAll('.modal-close');
    const likeBtn = document.getElementById('likeBtn');
    const copyPromptBtn = document.getElementById('copyPromptBtn');

    uploadBtn.onclick = () => uploadModal.classList.add('visible');
    closeBtns.forEach(btn => {
        btn.onclick = () => {
            uploadModal.classList.remove('visible');
            detailModal.classList.remove('visible');
        };
    });
    window.onclick = (event) => {
        if (event.target == uploadModal) uploadModal.classList.remove('visible');
        if (event.target == detailModal) detailModal.classList.remove('visible');
    };
    
    // 存储当前显示的作品数据
    let currentWork = null;
    
    function showWorkDetail(work) {
        currentWork = work; // 保存当前作品引用
        document.getElementById('detail-title').textContent = work.name;
        document.getElementById('detail-author').textContent = work.author;
        document.getElementById('detail-likes').textContent = work.likeCount;
        document.getElementById('detail-prompt').textContent = work.prompt;
        document.querySelector('#detailModal .work-image-large').src = work.imageUrl;
        detailModal.classList.add('visible');
    }
    
    // 点赞功能
    likeBtn.onclick = () => {
        if (currentWork) {
            // 随机增加1-10个点赞数
            const randomLikes = Math.floor(Math.random() * 10) + 1;
            currentWork.likeCount += randomLikes;
            document.getElementById('detail-likes').textContent = currentWork.likeCount;
            
            // 更新页面上对应卡片的点赞数
            const cards = document.querySelectorAll('.work-card');
            cards.forEach(card => {
                const cardInfo = card.querySelector('.work-info p');
                if (cardInfo && cardInfo.textContent.includes(currentWork.author)) {
                    cardInfo.textContent = `by ${currentWork.author} • ❤️ ${currentWork.likeCount}`;
                    cardInfo.title = `by ${currentWork.author} • ❤️ ${currentWork.likeCount}`;
                }
            });
            
            // 根据随机数显示不同的提示信息
            let message;
            if (randomLikes >= 8) {
                message = `哇！获得了 ${randomLikes} 个赞！作品太棒了！🎉`;
            } else if (randomLikes >= 5) {
                message = `太好了！获得了 ${randomLikes} 个赞！❤️`;
            } else {
                message = `点赞成功！+${randomLikes} 👍`;
            }
            showToast(message);
        }
    };
    
    // 复制Prompt功能
    copyPromptBtn.onclick = () => {
        if (currentWork) {
            navigator.clipboard.writeText(currentWork.prompt).then(() => {
                showToast('Prompt已复制到剪贴板');
            }).catch(() => {
                // 降级方案：使用传统方法复制
                const textArea = document.createElement('textarea');
                textArea.value = currentWork.prompt;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showToast('Prompt已复制到剪贴板');
            });
        }
    };

    function showToast(message) {
        const toast = document.getElementById('toast-notification');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
    
    function setupCharCounters() {
        const fields = [
            { id: 'work-name', max: 50 },
            { id: 'work-title', max: 300 },
            { id: 'author-name', max: 15 },
            { id: 'prompt', max: 8000 }
        ];
        fields.forEach(field => {
            const input = document.getElementById(field.id);
            const counter = input.parentNode.querySelector('.char-counter');
            if (input && counter) {
                input.addEventListener('input', () => {
                    const length = input.value.length;
                    counter.textContent = `${length} / ${field.max}`;
                });
            }
        });
    }
    setupCharCounters();


    // --- Initial Setup & Event Listeners ---
    setupLayout();

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(setupLayout, 300);
    });

    setInterval(() => {
        const isMobile = window.innerWidth <= 768;
        populateLatestWorks(isMobile);
    }, UPDATE_INTERVAL);
});