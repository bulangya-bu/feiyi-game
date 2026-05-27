/**
 * 画卷开卷动画
 * 首页专用：点击合起的画卷 → 展开动画 → 显示正文长卷
 */
(function () {
    const intro = document.getElementById("scroll-intro");
    const mainScroll = document.getElementById("main-scroll");
    if (!intro || !mainScroll) return;

    // 检查本次会话是否已经看过开卷动画
    const SESSION_KEY = "feiyi-scroll-opened";
    const alreadyOpened = sessionStorage.getItem(SESSION_KEY);

    if (alreadyOpened) {
        // 跳过动画，直接显示正文
        intro.style.display = "none";
        mainScroll.style.display = "";
        return;
    }

    let phase = "closed"; // closed → open → leaving → done

    function handleClick() {
        if (phase === "closed") {
            // 第一次点击：展开画卷
            phase = "open";
            intro.classList.add("is-open");
        } else if (phase === "open") {
            // 第二次点击：进入正文
            phase = "leaving";
            intro.classList.add("is-leaving");
            sessionStorage.setItem(SESSION_KEY, "1");

            setTimeout(function () {
                intro.style.display = "none";
                mainScroll.style.display = "";
                phase = "done";

                // 触发正文的 reveal 动效
                if (window.FeiyiPageEffects) {
                    window.FeiyiPageEffects.refresh(mainScroll);
                }
            }, 650);
        }
    }

    intro.addEventListener("click", handleClick);

    // 也支持键盘操作
    intro.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
        }
    });

    intro.setAttribute("tabindex", "0");
    intro.setAttribute("role", "button");
})();
