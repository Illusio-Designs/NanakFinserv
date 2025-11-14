import AuthRoutes from "./AuthRoutes";
import Sidebar from "./components/Sidebar";
const Layout = ({ children }) => {
    const directories = [
        { "Dashboard": [] },
        { "LMS": [] },
        { "Loan": [] },
        { "LifeInsurance": [] },
        { "Mediclaim": [] },
        { "VehicleInsurance": [] },
        { "Consumer": [] },
        { "Builder": [] },
        { "User": [] },
        { "Login": [] }
    ];
    return (
        <div>
            <Sidebar directories={directories} />
            <AuthRoutes />
            {children}
        </div>
    );
};

export default Layout;
