/**
 * Allows users to earn points from activities.
 */
 export default class PointOfInterestModifier {

    /** Modifier info */
    name = 'Point Of Interest'
    icon = require('./point-of-interest-icon.svg')

    get settings () {
        let settings = [
            { type: 'description', name: `The details for the point of interest.` },
            { type: 'text', id: 'pointofinterest_name', name: 'Name', help: `The name and indentifier of the point of interest.` },
            { type: 'text', id: 'pointofinterest_description', name: 'Description', help: `Talking points for the ai to speak about the place.` },
            { type: 'select', id: 'pointofinterest_category', name: 'Category', placeholder: 'General', values: ['general', 'content', 'media', 'activity'], labels: ['General', 'Content', 'Media', 'Activity'], help: 'The category the point of interest falls under.' },
            { type: 'file', id: 'pointofinterest_url', name: 'Icon', allowClear: true, help: `The image to render.`, onRemove: () => this.removeImage(true) },

        ]
        return settings
    }

    /** Called on load */
    async onLoad() {

        // Create empty
        this.object = new THREE.Group()

        // Start the check timer
        this.checkTimer = setInterval(() => this.check(), 1000)

        // Hide it
        metapress.entities.update(this.entity.id, {
            hidden: true,
            physical: false,
            point_of_interest_object: true
        })

    }

    /** Check if the editor is opened */
    check() {
        // Show or hide the tool based on if the editor is open
        if (metapress.editor?.isOpen) 
            this.$editor_onOpen()
    }

    /** Remove the image */
    removeImage(removeURL) {
        if (removeURL) metapress.entities.update(this.entity.id, {pointofinterest_url: null})
    }

    /** Called when the editor is opened */
    $editor_onOpen() {

        // Show it
        metapress.entities.update(this.entity.id, {
            hidden: false,
            physical: true,
        })

    }

    /** Called when the editor is closed */
    $editor_onClose() {
            
        // Hide it
        metapress.entities.update(this.entity.id, {
            hidden: true,
            physical: false,
        })

    }


}

