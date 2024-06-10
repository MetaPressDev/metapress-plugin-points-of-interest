import React, { useState } from "react"

/**
 * Points of Interest window react component
 */
export default class PointOfInterestWindow extends React.PureComponent {

    /** Initial state */
    state = {
        searchList: this.props.points,
        searchText: '',
    }

    /** Called after first render */
    componentDidMount() {
        this.allPoints = this.props.points
    }


    /** Called when a key is pressed in the input field */
    onInputKeyDown(e) {

        // Check which key was pressed
        if (e.key == 'Escape') {

            // Close the chat window
            metapress.menubar.closePanel()

        } 
        
    }

    /**
     * Called when the user has updated their search query.
     * @param {string} text Text that has been typed into the search field.
     */
    onSearch(text) {

        // Search has not changed
        if (text === this.prevSearch) {
            return
        }

        this.prevSearch = text
        this.setState({ searchText: text || '' })

        // Stop if nothing has been queried
        let query = text.trim()
        if (!query) {
            this.setState({ searchList: this.props.points })
            return
        }

        // Check keywords and description for a match
        query = query.toLowerCase()
        const results = this.allPoints.filter(point => {
            return point.pointofinterest_name.toLowerCase().includes(query)
        })

        // Update results of search
        this.setState({ searchList: results })
    }

    /** Render */
    render = () => <PanelContainer title='Points of Interest' onClose={() => metapress.menubar.closePanel()}>
        {/* Search */}
        <SearchField onChange={query => this.onSearch(query)} />

        {/* Messages */}
        <div style={{ position: 'absolute', left: 0, width: '100%', padding: 20, boxSizing: 'border-box' }}>
        
        {/* Render messages */}
        {this.state.searchList.map(m => <Place key={m.id} name={m.pointofinterest_name} point={m} category={m.pointofinterest_category ? m.pointofinterest_category  : 'General'} />)}

    </div>

    </PanelContainer>

}

/** 
 * Container for a panel.
 * @param {object} props Panel container properties.
 * @param {string} props.title The title of the panel.
 * @param {React.ReactNode} props.children The children of the panel.
 * @param {React.CSSProperties=} props.containerStyle Additional styling to apply to the container.
 * @param {Function=} props.onClose Function to execute when the close button is clicked.
 */
 export const PanelContainer = props => {

    // Return UI
    return <>
    
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', position: 'absolute', top: 0, left: 0, width: '100%', height: 44, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>

            {/* Title */}
            <div style={{ fontSize: 15, margin: '0px 20px', flex: '1 1 1px' }}>{props.title}</div>

            {/* Only show close button if there is a close function */}
            { props.onClose != null
                ? <img draggable='false' src={require('./close.svg')} title='Close' style={{ width: 20, height: 20, marginRight: 15, cursor: 'pointer' }} onClick={props.onClose} />
                : null
            }

        </div>

        {/* Scrollable content */}
        <div style={Object.assign({ position: 'absolute', top: 45, left: 0, width: '100%', height: 'calc(100% - 45px)', overflowX: 'hidden', overflowY: 'auto' }, props.containerStyle)}>
            {props.children}
        </div>

    </>

}

/** Message */
const Place = (props) => {
    let backgroundImage = props.point.pointofinterest_url ? props.point.pointofinterest_url : require('./point-of-interest-icon.svg')
    let category = props.category.charAt(0).toUpperCase() + props.category.slice(1);
    const handleOnMouseOver = e => {
       e.stopPropagation();
       let divs = document.getElementsByClassName('POI_Div')

       for (let div of divs) { 
            div.style.background = 'rgba(0,0,0,0)'
            div.style.border = 'none'
       }

       if (e.target.className == 'POI_Div') {
            e.target.style.background = 'rgba(0,0,0,0.2)';
            e.target.style.border = '0.1px white solid';
       }

    }

    const handleOnMouseLeave = e => {
        e.stopPropagation();
        if (e.target.className == 'POI_Div') {
            e.target.style.background = 'rgba(0,0,0,0)';
            e.target.style.border = 'none';
        }
    }

    return <div className="POI_Div" style={{ padding: 10, lineHeight: '1.5', cursor:'pointer', height: 50 }} onClick={e => metapress.pointofinterest.goToPoint(props.point)} onMouseEnter={e => handleOnMouseOver(e) } onMouseLeave={e => handleOnMouseLeave(e) } >
                <div style={{
                    flex: '0 0 auto',
                    width: 48,
                    height: 48,
                    alignSelf: 'stretch',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backgroundPosition: 'center',
                    backgroundSize: '48px 48px',
                    backgroundRepeat: 'no-repeat',
                    backgroundImage: 'url(' + backgroundImage + ')',
                    opacity: 1,
                    position: 'absolute'}}>
                </div>
                <div style={{ fontSize: 16, color: "white", paddingLeft: 60 }} onClick={e => metapress.pointofinterest.goToPoint(props.point)}>{props.name}</div>
                <div style={{ margin: 2, fontSize: 12, color: "grey", paddingLeft: 60  }}>{category} </div>
            </div>
}

/**
 * A search field.
 *
 * @component
 * @param {object} props Search field properties.
 * @param {Function} props.onSearch A function which is called with the new value when the user types something.
 * @param {boolean=} props.allowClear `true` to allow the search bar to be cleared, `false` otherwise.
 * @param {React.CSSProperties=} props.style Optional style to apply to the search field.
 */
 export const SearchField = props => {

    // Render UI
    return <div style={Object.assign({ 
        margin: '10px 20px', 
        textAlign: 'center', 
        padding: 0, 
        color: 'white', 
        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
        borderRadius: 5, 
        fontSize: 13,
        flex: '1 1 1px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    }, props.style)}>

        {/* Icon */}
        <img draggable='false' src={require('./icon-search.svg')} style={{ width: 18, margin: '0px 10px', opacity: 0.3 }} />

        {/* Serch field */}
        <input style={{ border: 'none', background: 'none', outline: 'none', color: 'white', fontSize: 13, flex: '1 1 1px', padding: '10px 0px' }} placeholder='Search...' autoComplete='off' autoCorrect='off' onChange={e => props.onChange(e.currentTarget.value)} />

    </div>

}