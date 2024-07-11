//
// My MetaPress Plugin

import React, { useState } from "react"
import packageJson from '../package.json'

import PointOfInterestModifier from './PointOfInterestModifier'
import PointOfInterestWindow from './PointOfInterestWindow'

export default class PointOfInterestPlugin {

    // Plugin information
    id              = packageJson.metapress?.id || packageJson.name
    name            = packageJson.metapress?.name || packageJson.name
    description     = packageJson.metapress?.description || packageJson.description
    version         = packageJson.version
    provides        = [ 'pointofinterest', 'modifier:pointofinterest' ]
    requires        = [ 'avatars' ]

    /** Create modifier */
    createModifier() {
        return new PointOfInterestModifier()
    }

    /** Called on load */
    onLoad() {
        // Create the menubar item
        metapress.entities.add({
        id: 'pointsofinterest.menu',
        type: 'menubar.item',
        name: 'Points Of Interest',
        description: "Can be used to go to point of interest items.",
        is_panel: true,
        icon: require('./point-of-interest-icon.svg'),
        onClick: () => this.toggleUI()
        })
    }

    /** 
     * Open or close the point of interest window.
     * 
     * @public
     */
    toggleUI() {
        let points = this.getPoints()
        metapress.menubar.toggleReactPanel('pointsofinterest.menu', () => <PointOfInterestWindow plugin={this} points={points} />)
    }

    /** Get addable entities */
    $editor_getAddableEntities = () => [{
        id: 'pointofinterest',
        name: 'Point of Interest',
        icon: require('./point-of-interest-icon.svg'),
        description: 'Adds a point of interest object.',
        action: e => this.addPoint()
    }]

    /** Add a interest point */
    addPoint() {
    
        // Calculate position 2 meters in front of the user
        let v3a = new THREE.Vector3()
        let v3b = new THREE.Vector3()
        metapress.renderer.camera.getWorldPosition(v3a)
        metapress.renderer.camera.getWorldDirection(v3b)
        v3b.setLength(2)
        v3b.add(new THREE.Vector3(0, 1, 0).cross(v3b).setLength(1))
        v3b.add(v3a)

        // Add it
        let newEntity = metapress.entities.add({

            // Object properties
            name: 'Point of Interest',
            sync: 'template',
            'modifier:pointofinterest': true,
            type: 'mesh',
            url: require('./point-of-interest_indicator.glb'),
            hidden: false,
            physical: true,
            x: v3b.x,
            y: v3b.y,
            z: v3b.z,

        })

        // Select it
        metapress.editor.selectionManager.select(newEntity.id)
        
    }

    /**
     * Moves the user by finding an interest point and moving the user to it.
     * 
     * @public
     */
    goToPoint(point) {

        let pointOfInterest = null

        if (point) {
            pointOfInterest = point
        } else {
            // If no interest point is passed in pick one at random
            pointOfInterest = this.getRandomPoint()
        }

        let x = (pointOfInterest?.x || 0)
        let y = (pointOfInterest?.y || 0) + 0.1
        let z = (pointOfInterest?.z || 0)
        if (!pointOfInterest)
            console.warn(`[PointOfInterestPlugin] No points of interest found in the world.`)

        // Apply radius offset
        let radiusOffset = 1
        x += Math.random() * radiusOffset * 2 - radiusOffset
        z += Math.random() * radiusOffset * 2 - radiusOffset

        // Move the user
        metapress.avatars.moveTo(x, y, z)

        // Apply rotation if it exists
        if (pointOfInterest?.quatX || pointOfInterest?.quatY || pointOfInterest?.quatZ || pointOfInterest?.quatW) {

            // Get rotation of the spawn point on the Y axis
            let quat = new THREE.Quaternion(pointOfInterest.quatX || 0, pointOfInterest.quatY || 0, pointOfInterest.quatZ || 0, pointOfInterest.quatW || 0)
            let euler = new THREE.Euler().setFromQuaternion(quat, 'YXZ')

            // Rotate the camera in the same direction
            metapress.camera.rotation.y = euler.y

        } else {
            // Get rotation of the spawn point on the Y axis
            let quat = new THREE.Quaternion(0, 0, 0, 0)
            let euler = new THREE.Euler().setFromQuaternion(quat, 'YXZ')

            // Rotate the camera in the same direction
            metapress.camera.rotation.y = euler.y
        }

        metapress.menubar.closePanel()

        // Notify complete
        metapress.plugins.sendEvent('pointofinterest_onMove', { x, y, z })

    }

    /**
     * Get all the interest points.
     * 
     * @public
     */
    getPoints() {
        let pointsOfInterest = metapress.entities.all.filter(e => e.name == 'Point of Interest' || e.point_of_interest_object)

        return pointsOfInterest
    }

    /** Get a random interest points */
    getRandomPoint(category, name) {
        // Find list of spawn points in the space, and pick one at random
        let pointsOfInterest = this.getPoints()

        // Filter by category
        if (category) {
            pointsOfInterest = pointsOfInterest.filter(e => e.pointofinterest_category == category)
        }

        // Filter by name
        if (name) {
            allObjects = allObjects.filter(e => e.pointofinterest_name.includes(name))
        }

        let pointOfInterest = pointsOfInterest[Math.floor(Math.random() * pointsOfInterest.length)]

        return pointOfInterest
    }

    /** Get closest point of interest object */
    getClosest(category, name) {
        //get objects
        let allObjects = this.getPoints()
        let objectsWithDistance = []

        // Filter by category
        if (category) {
            allObjects = allObjects.filter(e => e.pointofinterest_category == category.toLowerCase())
        }

        // Filter by name
        if (name) {
            allObjects = allObjects.filter(e => e.pointofinterest_name.includes(name))
        }

        // Initialize User Vectors
        let userPosition = new THREE.Vector3(metapress.avatars?.currentUserEntity.x || 0, metapress.avatars?.currentUserEntity.y || 0, metapress.avatars?.currentUserEntity.z || 0)

        for (let a of allObjects) {

            let entity = a

            // Initialize object Vectors
            let objectPosition = new THREE.Vector3(a.x, a.y, a.z)
    
            // Get the distance
            let distance = userPosition.distanceTo(objectPosition)

            entity.distance = distance
            objectsWithDistance.push(entity)
            
        }

        // Sort by distance
        if (objectsWithDistance.length > 0) {
            objectsWithDistance.sort((a, b) => a.distance - b.distance)
            return objectsWithDistance[0]
        } else {
            return
        }

    }

    /** Go To Closest */
    goToClosestPoint(category, name) {
        //get objects
        let object = this.getClosest(category, name)
        
        this.goToPoint(object)
    }

    /** Go To Random */
    goToRandomPoint(category, name) {
        //get objects
        let object = this.getRandomPoint(category, name)
        
        this.goToPoint(object)
    }

    /** AI knowledge base */
    $ai_getKnowledgeBaseEntries = () => [

        // Information about the plugin
        {
            id: `${this.id}:info`,
            type: 'info',
            name: 'Point of Interest',
            tags: 'point of interest, place, activity, scripts, logic, travel, teleport, user movement',
            content: `
                The point of interest can be used to travel to predefined points of interest or places in the wolrd. For example, take user to the closest point of action or take user to a random point of action with this name or category or show the user what activities or interesting things there are available in the space, etc.
                To use it, add the "Point of Interest" object from the Editor and configure the point of interest details. Current points of interest are ${this.getPoints().map(o => `name=${o.pointofinterest_name || 'unnamed'} description=${o.pointofinterest_description || 'none'}`).join(', ')} ${!this.canEdit ? 'speak about them in natural language.':''}
                ${this.canEdit ? `You can also add more points of interest by clicking the "Add Point of Interest" button in the Editor. Add descriptions in a way that you think people would enjoy it.` : ''}
            `,
        },

        // Actions
        {
            id: `${this.id}:goToPoint`,
            type: 'action',
            name: 'Point of Interest - Go to point',
            tags: 'go to point go to activity, go to place, move to point, move to activity, move to place',
            content: `
                Assistant instruction: Use this action to go to a point of interest that matches the name. The value is the name to go to.
                The possible locations are: ${this.getPoints().map(e => e.pointofinterest_name).join(', ')}.
            `,
            action: input => {
                if (!input.value) throw new Error("Cannot go to empty name.")
                this.goToClosestPoint(null,input.value)
                return 'Moved user to point of interest'
            }
        },
        {
            id: `${this.id}:goToRandomPoint`,
            type: 'action',
            name: 'Point of Interest - Go to random point',
            tags: 'go to random point, go to random activity, go to random place, move to random point, move to random activity, move to random place',
            content: `
                Assistant instruction: Run this action when the user asks to go to a random point of interest or place.
            `,
            action: input => {
                this.goToRandomPoint()
                return 'Moved user to point of interest'
            }
        },
        {
            id: `${this.id}:goToClosestPoint`,
            type: 'action',
            name: 'Point of Interest - Go to closest point',
            tags: 'go to closest point, go to closest activity, go to closest place, move to closest point, move to closest activity, move to closest place',
            content: `
                Assistant instruction: Run this action when the user asks to go to the closest point of interest or place.
            `,
            action: input => {
                this.goToClosestPoint()
                return 'Moved user to point of interest'
            }
        },
        {
            id: `${this.id}:goToClosestPointByCategory`,
            type: 'action',
            name: 'Point of Interest - Go to closest point by category',
            tags: 'go to closest point in category, go to closest activity in category, go to closest place in category, move to closest point in category, move to closest activity in category, move to closest place in category',
            content: `
                Assistant instruction: Run this action with value 'general' or 'media' or 'content' or 'activity' and when the user asks to go to the closest point of interest or place with a specific category.
            `,
            action: input => {
                if (!input.value) throw new Error("Cannot go to empty category.")
                this.goToClosestPoint(input.value)
                return 'Moved user to point of interest'
            }
        },
        {
            id: `${this.id}:goToRandomPointByCategory`,
            type: 'action',
            name: 'Point of Interest - Go to random point by category',
            tags: 'go to random point in category, go to random activity in category, go to random place in category, move to random point in category, move to random activity in category, move to random place in category',
            content: `
                Assistant instruction: Run this action with value 'general' or 'media' or 'content' or 'activity' and when the user asks to go to a random point of interest or place with a specific category.
            `,
            action: input => {
                if (!input.value) throw new Error("Cannot go to empty category.")
                this.goToRandomPoint(input.value)
                return 'Moved user to point of interest'
            }
        },

    ]

    

}