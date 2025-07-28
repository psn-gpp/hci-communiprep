import React, { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import API from "../API.mjs";
import { useVoice } from './VoiceContext';

function AppLayout() {
    const [activeMenu, setActiveMenu] = useState('/');
    const [name, setName] = useState('');
    const handleMenuClick = (path) => setActiveMenu(path);
    const { voice, setVoice } = useVoice();
    const location = useLocation();

    useEffect(() => {
        setActiveMenu(location.pathname);
    }, [location.pathname]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const a = await API.getUserInfo(2);
                if (a != null) {
                    setName(a.full_name);
                    setVoice(a.avatar_voice);
                }
            } catch (e) {
                console.error(e);
            }
        };
        checkAuth();
    }, [setVoice]);

    return (
        <div className="d-flex flex-column vh-100">
            <Navbar voice={voice} setVoice={setVoice} />
            <div className="d-flex flex-grow-1">
                {!location.pathname.startsWith("/interview") && !location.pathname.startsWith("/feedback") &&
                    <Sidebar
                        activeMenu={activeMenu}
                        onMenuClick={handleMenuClick}
                        name={name}
                        voice={voice}
                    />
                }
                <main className="main-with-sidebar">
                    <Outlet />
                </main>
            </div>
            
        </div>
    );
}

export default AppLayout;
