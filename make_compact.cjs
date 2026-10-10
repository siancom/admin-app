const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

let compactContent = content.replace(
    /<div className="pb-10 px-2 sm:px-6 relative mt-4">/g,
    '<div className="pb-4 px-2 sm:px-6 relative mt-4">'
);
compactContent = compactContent.replace(
    /<div className="absolute left-6 sm:left-1\/2 top-12 bottom-0 w-1/g,
    '<div className="absolute left-[21px] sm:left-1/2 top-12 bottom-0 w-0.5'
);
compactContent = compactContent.replace(
    /className="mb-12 relative scroll-mt-24"/g,
    'className="mb-6 relative scroll-mt-24"'
);
compactContent = compactContent.replace(
    /className="flex justify-start sm:justify-center mb-6 relative z-20 sticky top-20 pt-2"/g,
    'className="flex justify-start sm:justify-center mb-3 relative z-20 sticky top-20 pt-1"'
);
compactContent = compactContent.replace(
    /className="bg-blue-100 text-blue-800 border-2 border-blue-200 px-6 py-2\.5 rounded-full text-sm font-black/g,
    'className="bg-blue-100 text-blue-800 border-2 border-blue-200 px-4 py-1.5 rounded-full text-[11px] font-black'
);
compactContent = compactContent.replace(
    /<Calendar size=\{18\} className="mr-2 text-blue-600"\/>/g,
    '<Calendar size={14} className="mr-1 text-blue-600"/>'
);
compactContent = compactContent.replace(
    /w-4 h-4 bg-white border-4/g,
    'w-3 h-3 bg-white border-2'
);
compactContent = compactContent.replace(
    /ml-\[18px\]/g,
    'ml-[19px]'
);
compactContent = compactContent.replace(
    /<div className="space-y-6">/g,
    '<div className="space-y-2">'
);
compactContent = compactContent.replace(
    /mt-6 sm:mt-0 shadow-sm/g,
    'mt-2.5 sm:mt-0 shadow-sm'
);
compactContent = compactContent.replace(
    /pl-14 pr-2 mt-2 sm:mt-0/g,
    'pl-10 pr-1 mt-1 sm:mt-0'
);
compactContent = compactContent.replace(
    /rounded-2xl p-3 shadow-sm hover:shadow-md transition-all w-full max-w-sm relative overflow-hidden/g,
    'rounded-xl px-2.5 py-1.5 shadow-sm hover:shadow-md transition-all w-full max-w-sm relative overflow-hidden'
);
compactContent = compactContent.replace(
    /className="flex justify-between items-start mb-1\.5 pl-2"/g,
    'className="flex justify-between items-start mb-0.5 pl-2"'
);
compactContent = compactContent.replace(
    /text-\[13px\] leading-tight mb-2 line-clamp-1/g,
    'text-xs leading-tight mb-1 line-clamp-1'
);
compactContent = compactContent.replace(
    /mt-1 pt-2 border-t/g,
    'mt-0.5 pt-1.5 border-t'
);
compactContent = compactContent.replace(
    /w-7 h-7 rounded-full/g,
    'w-5 h-5 rounded-full'
);
compactContent = compactContent.replace(
    /<Users size=\{12\} /g,
    '<Users size={10} '
);
compactContent = compactContent.replace(
    /p-1\.5 bg-gray-50/g,
    'p-1 bg-gray-50'
);
compactContent = compactContent.replace(
    /p-1\.5 bg-red-50/g,
    'p-1 bg-red-50'
);
compactContent = compactContent.replace(
    /<QrCode size=\{14\}\/>/g,
    '<QrCode size={12}/>'
);
compactContent = compactContent.replace(
    /<Trash2 size=\{14\}\/>/g,
    '<Trash2 size={12}/>'
);
compactContent = compactContent.replace(
    /pl-\[52px\] sm:pl-10 mt-2 sm:mt-0/g,
    'pl-[40px] sm:pl-10 mt-1 sm:mt-0'
);
compactContent = compactContent.replace(
    /w-10 h-0\.5/g,
    'w-8 h-0.5'
);

fs.writeFileSync('src/App.jsx', compactContent, 'utf8');
console.log("Compact styling applied.");
