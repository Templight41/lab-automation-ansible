'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path ? 'bg-blue-900 text-blue-300' : 'text-gray-300 hover:bg-gray-800';
    };

    return (
        <nav className="bg-gray-900 shadow-md">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link href="/" className="flex-shrink-0 font-bold text-xl text-white">
                            Lab Automation
                        </Link>
                    </div>
                    <div className="flex space-x-4">
                        <Link 
                            href="/" 
                            className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/')}`}
                        >
                            Home
                        </Link>
                        <Link 
                            href="/playbooks" 
                            className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/playbooks')}`}
                        >
                            Playbooks
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
} 