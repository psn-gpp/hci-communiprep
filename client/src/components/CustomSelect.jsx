const CustomSelect = {
    control: (provided) => ({
        ...provided,
        borderRadius: '15px',
        boxShadow: 'none',
        borderColor: '#ddd',
    }),
    menu: (provided) => ({
        ...provided,
        borderRadius: '15px',
        borderColor: '#000',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.8)',
       
    }),
    option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#341f97' : '#fff',
        color: state.isSelected ? 'white' : 'black',
        fontWeight: state.isSelected ? 'bold' : 'normal', 
        borderRadius: '15px',
        paddingLeft: '20px',
        cursor: 'pointer', 
        marginBottom: '3px',
        ':hover': {
            backgroundColor: state.isSelected ? '#341f97' : '#c7cbe7',
            fontWeight: 'bold', 
        },
    }),    
    placeholder: (provided) => ({
        ...provided,
        fontSize: '14px',
        color: '#888888',
        fontStyle: 'regular',
    }),
};


export default CustomSelect;
