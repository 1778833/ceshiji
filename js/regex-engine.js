/**
 * 正则替换引擎 - 用于全局文本处理
 * 读取 localStorage 中的规则并应用于文本
 */
const RegexEngine = {
    // 获取所有规则
    getRules: () => {
        try {
            return JSON.parse(localStorage.getItem('fruit_machine_regex_rules')) || [];
        } catch (e) {
            console.error('Failed to load regex rules:', e);
            return [];
        }
    },

    // 处理文本
    processText: (text) => {
        if (!text || typeof text !== 'string') return text;
        
        const rules = RegexEngine.getRules();
        let result = text;
        
        rules.forEach(rule => {
            // 如果规则被禁用，跳过
            if (rule.active === false) return; 
            
            try {
                let pattern = rule.pattern;
                let flags = rule.flags || 'g';

                // 简单的防错检查
                if (!pattern) return;

                const regex = new RegExp(pattern, flags);
                
                // 处理替换文本中的常见转义序列
                // 用户输入 "\n" 时，通常希望是换行符
                let replacement = rule.replacement || '';
                replacement = replacement
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '\r')
                    .replace(/\\t/g, '\t');

                result = result.replace(regex, replacement);
            } catch (e) {
                // 忽略错误的正则，避免阻断整个流程
                console.warn(`Regex error for rule: ${rule.name || rule.pattern}`, e);
            }
        });
        
        return result;
    }
};

// 暴露给全局作用域
window.RegexEngine = RegexEngine;
