import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="text-8xl font-bold text-stone-200 dark:text-stone-700 mb-4">404</div>
        <p className="text-stone-600 dark:text-stone-300 font-medium mb-2">页面不存在</p>
        <p className="text-stone-400 dark:text-stone-500 text-sm mb-6">你访问的页面可能已被移除或路径不正确</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          返回首页
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
